import { and, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";
import { webpayTransaction, type WebpayCommit } from "@/lib/payments/webpay";
import { siteUrl } from "@/lib/site-url";

const { orders } = schema;

/**
 * Retorno de Webpay Plus. Casos:
 *  - token_ws                       → flujo normal: commit (una sola vez por token)
 *  - TBK_TOKEN + TBK_ORDEN_COMPRA   → el usuario anuló en el formulario de Webpay
 *  - solo TBK_ORDEN_COMPRA          → timeout / abandono
 */
async function handle(params: URLSearchParams) {
  const token = params.get("token_ws");
  const tbkToken = params.get("TBK_TOKEN");
  const buyOrder = params.get("TBK_ORDEN_COMPRA");

  const go = (path: string) => NextResponse.redirect(siteUrl(path), 303);

  if (token && !tbkToken) {
    // Reclama la orden de forma atómica: si ya se procesó (recarga de la página), no se vuelve a hacer commit.
    const claimed = await db
      .update(orders)
      .set({ paymentDetails: { provider: "webpay", committing: true }, updatedAt: new Date() })
      .where(and(eq(orders.paymentToken, token), eq(orders.status, "pendiente"), isNull(orders.paymentDetails)))
      .returning();

    if (!claimed.length) {
      const [existing] = await db.select({ code: orders.code }).from(orders).where(eq(orders.paymentToken, token)).limit(1);
      return existing ? go(`/checkout/gracias/?orden=${existing.code}`) : go("/checkout/?error=pago");
    }

    const order = claimed[0];
    try {
      const transaction = webpayTransaction();
      let r: WebpayCommit;
      try { r = (await transaction.commit(token)) as WebpayCommit; }
      catch { r = (await transaction.status(token)) as WebpayCommit; }
      const approved = r.status === "AUTHORIZED" && r.response_code === 0 && r.amount === order.total && r.buy_order === order.code;
      const details = {
        provider: "webpay",
        status: r.status,
        response_code: r.response_code,
        payment_type_code: r.payment_type_code,
        installments_number: r.installments_number,
        card_last4: r.card_detail?.card_number,
        transaction_date: r.transaction_date,
      };
      if (approved) await markOrderPaid(order.id, { authorizationCode: r.authorization_code, details });
      else if (["FAILED", "REVERSED", "NULLIFIED"].includes(r.status)) await markOrderFailed(order.id, "rechazada", details);
      else await db.update(orders).set({ paymentDetails: null, updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.status, "pendiente")));
    } catch (e) {
      console.error("[webpay] commit falló", e);
      // A network failure does not prove that no charge occurred. Allow a later return to retry/reconcile.
      await db.update(orders).set({ paymentDetails: null, updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.status, "pendiente")));
    }
    return go(`/checkout/gracias/?orden=${order.code}`);
  }

  if (buyOrder) {
    const [order] = await db.select().from(orders).where(eq(orders.code, buyOrder)).limit(1);
    const session = params.get("TBK_ID_SESION");
    if (order?.paymentMethod === "webpay" && (tbkToken ? tbkToken === order.paymentToken : session === `s-${order.id}`))
      await markOrderFailed(order.id, "anulada", { provider: "webpay", aborted: true, timeout: !tbkToken });
    return go(`/checkout/gracias/?orden=${buyOrder}`);
  }

  return go("/checkout/");
}

export async function GET(req: NextRequest) {
  return handle(req.nextUrl.searchParams);
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const params = new URLSearchParams(req.nextUrl.searchParams);
  form?.forEach((v, k) => typeof v === "string" && params.set(k, v));
  return handle(params);
}
