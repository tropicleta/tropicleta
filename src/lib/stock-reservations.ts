import "server-only";
import { and, eq, gt, ne, sql } from "drizzle-orm";
import { schema } from "@/db";
import type { DB } from "@/db/client";

type Transaction = Parameters<Parameters<DB["transaction"]>[0]>[0];
type Item = { productId: number; quantity: number };
export const RESERVATION_MINUTES = 30;
export class StockUnavailable extends Error {
  constructor(public productId: number, public available: number) { super("Stock reservado o agotado"); }
}

/** Lock in a stable order, shared by checkout and payment confirmation. */
export async function availableForOrder(tx: Transaction, orderId: number, items: Item[]) {
  const availability = new Map<number, number>();
  for (const item of [...items].sort((a,b)=>a.productId-b.productId)) {
    const [product] = await tx.select().from(schema.products).where(eq(schema.products.id,item.productId)).for("update");
    const [held] = await tx.select({ quantity: sql<number>`coalesce(sum(${schema.stockReservations.quantity}),0)::int` })
      .from(schema.stockReservations).where(and(eq(schema.stockReservations.productId,item.productId),ne(schema.stockReservations.orderId,orderId),gt(schema.stockReservations.expiresAt,new Date())));
    availability.set(item.productId, product?.active ? Math.max(0,product.stock-Number(held.quantity)) : 0);
  }
  return availability;
}

export async function reserveOrderStock(tx: Transaction, orderId: number, items: Item[]) {
  const available = await availableForOrder(tx,orderId,items);
  for(const item of items) if((available.get(item.productId)??0)<item.quantity) throw new StockUnavailable(item.productId,available.get(item.productId)??0);
  await tx.insert(schema.stockReservations).values(items.map(item=>({...item,orderId,expiresAt:new Date(Date.now()+RESERVATION_MINUTES*60_000)})));
}

/** An expired or legacy payment may not take units reserved by another buyer. */
export async function allocateOrderStock(tx: Transaction, orderId: number, items: Item[]) {
  const available = await availableForOrder(tx,orderId,items);
  if(items.some(item=>(available.get(item.productId)??0)<item.quantity)) {
    await tx.delete(schema.stockReservations).where(eq(schema.stockReservations.orderId,orderId));
    return false;
  }
  for(const item of items) await tx.update(schema.products).set({stock:sql`${schema.products.stock}-${item.quantity}`}).where(eq(schema.products.id,item.productId));
  await tx.delete(schema.stockReservations).where(eq(schema.stockReservations.orderId,orderId));
  return true;
}
