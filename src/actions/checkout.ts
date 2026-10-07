"use server";

import { db, schema } from "@/db";
import { formToObject, zodErrors, type FormState } from "@/lib/forms";
import { shortCode } from "@/lib/format";
import { getProductsByIds } from "@/lib/queries";
import { shippingCost } from "@/data/shop";
import { checkoutSchema } from "@/lib/validation";
import { mpEnabled, mpPreference } from "@/lib/payments/mercadopago";
import { siteUrl } from "@/lib/site-url";
import { eq } from "drizzle-orm";

export type CheckoutState = FormState & {
  /** Redirección al pago en Mercado Pago. */
  redirect?: { kind: "url"; url: string };
  /** Productos cuyo stock o precio cambió: el cliente debe actualizar su carrito. */
  stockIssues?: { productId: number; available: number }[];
};

export async function startCheckout(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  try {
    return await checkout(fd);
  } catch (error) {
    console.error("[checkout] no se pudo preparar la compra", error);
    return { message: "No pudimos preparar tu compra. Tu carrito se conserva; vuelve a intentarlo en unos minutos.", values: formToObject(fd) };
  }
}

async function checkout(fd: FormData): Promise<CheckoutState> {
  const values = formToObject(fd);
  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const d = parsed.data;

  if (d.paymentMethod === "mercadopago" && !mpEnabled()) {
    return { errors: { paymentMethod: "Mercado Pago aún no está disponible. Intenta nuevamente más tarde." }, values };
  }

  // 1) Recalcular todo en el servidor desde la BD (nunca confiar en precios del cliente)
  const merged = new Map<number, number>();
  for (const i of d.items) merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.quantity);
  if ([...merged.values()].some((quantity) => quantity > 10))
    return { message: "El máximo por producto es 10 unidades. Revisa tu carrito.", values };
  const dbProducts = await getProductsByIds([...merged.keys()]);

  const stockIssues: { productId: number; available: number }[] = [];
  const lines = [...merged.entries()].map(([productId, quantity]) => {
    const p = dbProducts.find((x) => x.id === productId);
    if (!p || p.stock < quantity) stockIssues.push({ productId, available: p?.stock ?? 0 });
    return { product: p!, quantity };
  });
  if (stockIssues.length) {
    return {
      message: "Algunos productos ya no tienen stock suficiente. Actualizamos tu carrito, revísalo antes de pagar.",
      stockIssues,
      values,
    };
  }

  const subtotal = lines.reduce((n, l) => n + l.product.price * l.quantity, 0);
  const shipping = shippingCost(d.deliveryMethod, d.commune);
  const total = subtotal + shipping;
  const code = shortCode("TPC", 10);

  // 2) Crear la orden pendiente
  const order = await db.transaction(async (tx) => {
  const [created] = await tx
    .insert(schema.orders)
    .values({
      code,
      customerName: d.name,
      customerEmail: d.email,
      customerPhone: d.phone,
      deliveryMethod: d.deliveryMethod,
      commune: d.deliveryMethod === "despacho" ? d.commune! : null,
      address: d.deliveryMethod === "despacho" ? d.address! : null,
      notes: d.notes || null,
      subtotal,
      shipping,
      total,
      paymentMethod: d.paymentMethod,
    })
    .returning();
  await tx.insert(schema.orderItems).values(
    lines.map((l) => ({ orderId: created.id, productId: l.product.id, name: l.product.name, unitPrice: l.product.price, quantity: l.quantity })),
  );
  return created;
  });

  // 3) Iniciar el pago
  try {
    const isHttps = siteUrl().startsWith("https://");
    const pref = await mpPreference().create({
      body: {
        external_reference: code,
        items: [
          ...lines.map((l) => ({
            id: String(l.product.id),
            title: l.product.name,
            quantity: l.quantity,
            unit_price: l.product.price,
            currency_id: "CLP",
          })),
          ...(shipping ? [{ id: "despacho", title: "Despacho", quantity: 1, unit_price: shipping, currency_id: "CLP" }] : []),
        ],
        payer: { name: d.name, email: d.email },
        back_urls: {
          success: siteUrl(`/checkout/gracias/?orden=${code}`),
          pending: siteUrl(`/checkout/gracias/?orden=${code}`),
          failure: siteUrl(`/checkout/gracias/?orden=${code}&mp=failure`),
        },
        ...(isHttps ? { auto_return: "approved", notification_url: siteUrl("/api/mercadopago/webhook/") } : {}),
        statement_descriptor: "TROPICLETA",
      },
    });
    await db.update(schema.orders).set({ paymentToken: pref.id ?? null }).where(eq(schema.orders.id, order.id));
    const url = process.env.MP_SANDBOX === "1" ? pref.sandbox_init_point : pref.init_point;
    if (!url) throw new Error("Mercado Pago no devolvió un enlace de pago");
    return { redirect: { kind: "url", url } };
  } catch (e) {
    console.error("[checkout] error pasarela", e);
    await db.update(schema.orders).set({ status: "anulada" }).where(eq(schema.orders.id, order.id));
    return { message: "No pudimos conectar con el medio de pago. Intenta nuevamente en unos minutos.", values };
  }
}
