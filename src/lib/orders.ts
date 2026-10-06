import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminEmail, emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { displayPhone, formatCLP } from "@/lib/format";
import { siteUrl } from "@/lib/site-url";
import { revalidateShopStock } from "@/lib/revalidate";

const { orders, orderItems, products } = schema;

export async function getOrderByCode(code: string) {
  const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}

/**
 * Marca una orden como pagada UNA sola vez (idempotente): solo pasa de "pendiente" a "pagada".
 * Descuenta stock y envía emails solo en la primera transición.
 */
export async function markOrderPaid(
  orderId: number,
  payment: { authorizationCode?: string | null; paymentId?: string | null; details?: unknown },
) {
  const changed = await db.transaction(async (tx) => {
    const updated = await tx
      .update(orders)
      .set({
        status: "pagada",
        paidAt: new Date(),
        updatedAt: new Date(),
        authorizationCode: payment.authorizationCode ?? null,
        paymentId: payment.paymentId ?? null,
        paymentDetails: payment.details ?? null,
      })
      .where(and(eq(orders.id, orderId), inArray(orders.status, ["pendiente", "rechazada"])))
      .returning({ id: orders.id });
    if (!updated.length) return false;

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const it of items) {
      if (!it.productId) continue;
      await tx
        .update(products)
        .set({ stock: sql`GREATEST(${products.stock} - ${it.quantity}, 0)` })
        .where(eq(products.id, it.productId));
    }
    return true;
  });

  if (changed) {
    revalidateShopStock();
    await sendOrderEmails(orderId);
  }
  return changed;
}

export async function markOrderFailed(orderId: number, status: "rechazada" | "anulada", details?: unknown) {
  await db
    .update(orders)
    .set({ status, updatedAt: new Date(), paymentDetails: details ?? null })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pendiente")));
}

async function sendOrderEmails(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const rows = items
    .map((i) => `<tr><td>${i.quantity} × ${escapeHtml(i.name)}</td><td align="right">${formatCLP(i.unitPrice * i.quantity)}</td></tr>`)
    .join("");
  const delivery =
    order.deliveryMethod === "retiro"
      ? "Retiro en el taller (te avisamos cuando esté listo)"
      : `Despacho a ${escapeHtml(order.address ?? "")}, ${escapeHtml(order.commune ?? "")}`;
  const body = `
    <p>Orden <b>${order.code}</b></p>
    <table width="100%" style="color:#d3d5d7;font-size:14px">${rows}
      <tr><td>Despacho</td><td align="right">${formatCLP(order.shipping)}</td></tr>
      <tr><td><b>Total</b></td><td align="right"><b style="color:#f28a17">${formatCLP(order.total)}</b></td></tr>
    </table>
    <p>${delivery}</p>`;

  await Promise.all([
    sendEmail(
      order.customerEmail,
      `Tu compra en Tropicleta · ${order.code}`,
      emailLayout(
        "¡Gracias por tu compra!",
        `<p>Hola ${escapeHtml(order.customerName.split(" ")[0])}, recibimos tu pago.</p>${body}
         <p><a style="color:#f28a17" href="${siteUrl(`/checkout/gracias/?orden=${order.code}`)}">Ver mi orden</a></p>`,
      ),
    ),
    sendEmail(
      adminEmail(),
      `Nueva venta ${order.code} · ${formatCLP(order.total)}`,
      emailLayout(
        "Nueva venta",
        `<p>${escapeHtml(order.customerName)} · ${displayPhone(order.customerPhone)} · ${escapeHtml(order.customerEmail)}</p>${body}`,
      ),
    ),
  ]);
}

/** Consulta un pago en Mercado Pago y actualiza la orden (webhook y página de retorno). */
export async function syncMercadoPagoPayment(paymentId: string) {
  const { mpPayment } = await import("@/lib/payments/mercadopago");
  const p = await mpPayment().get({ id: paymentId });
  if (!p.external_reference) return null;
  const [order] = await db.select().from(orders).where(eq(orders.code, p.external_reference)).limit(1);
  if (!order || order.paymentMethod !== "mercadopago") return null;

  if (p.status === "approved") {
    if (p.currency_id !== "CLP" || p.transaction_amount !== order.total || p.live_mode !== (process.env.MP_SANDBOX !== "1")) {
      console.error(`[mp] pago incompatible con ${order.code}: monto, moneda o ambiente incorrectos`);
      await flagMercadoPagoIssue(order, "pago_incompatible", p, `El pago aprobado no coincide con el monto, moneda CLP o ambiente esperado. La orden suma ${formatCLP(order.total)}. Revisar en Mercado Pago antes de entregar.`);
      return order.code;
    }
    await markOrderPaid(order.id, {
      paymentId: String(p.id),
      authorizationCode: p.authorization_code ?? null,
      details: { provider: "mercadopago", status: p.status, status_detail: p.status_detail, payment_type: p.payment_type_id },
    });
  } else if (p.status === "rejected" || p.status === "cancelled") {
    await markOrderFailed(order.id, p.status === "rejected" ? "rechazada" : "anulada", {
      provider: "mercadopago",
      status: p.status,
      status_detail: p.status_detail,
    });
  } else if (p.status === "refunded" || p.status === "charged_back") {
    // No se cambia el estado: la contabilidad registra devoluciones como gasto (ver ADMINISTRACION.md).
    await flagMercadoPagoIssue(order, p.status, p, p.status === "refunded"
      ? "Mercado Pago informa que el pago fue devuelto. Registra la devolución en Contabilidad y anula la orden si corresponde."
      : "Mercado Pago informa un contracargo (el cliente desconoció el pago). Revisa el caso en tu cuenta de Mercado Pago.");
  }
  return order.code;
}

type MpPaymentInfo = { id?: number; status?: string; status_detail?: string; transaction_amount?: number };

/** Guarda una incidencia en paymentDetails y avisa al admin una sola vez por tipo (el webhook se repite). */
async function flagMercadoPagoIssue(order: typeof orders.$inferSelect, issue: string, p: MpPaymentInfo, message: string) {
  const details = (order.paymentDetails ?? {}) as { issues?: string[] } & Record<string, unknown>;
  if (details.issues?.includes(issue)) return;
  await db
    .update(orders)
    .set({
      updatedAt: new Date(),
      paymentDetails: {
        ...details,
        issues: [...(details.issues ?? []), issue],
        [`mp_${issue}`]: { paymentId: p.id, status: p.status, status_detail: p.status_detail, amount: p.transaction_amount, at: new Date().toISOString() },
      },
    })
    .where(eq(orders.id, order.id));
  await sendEmail(
    adminEmail(),
    `Revisar orden ${order.code} · Mercado Pago`,
    emailLayout("Revisar orden", `<p>Orden <b>${order.code}</b> · ${escapeHtml(order.customerName)} · ${escapeHtml(order.customerEmail)}</p><p>${escapeHtml(message)}</p><p>ID de pago Mercado Pago: ${p.id ?? "—"}</p>`),
  );
}
