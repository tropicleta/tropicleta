import { resolvePaidStock } from "@/actions/admin";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { deliveryLabel, displayPhone, formatCLP, formatDateTime, paymentLabel } from "@/lib/format";
import { customerWhatsapp, orderStatusMessage, orderTransitions } from "@/lib/order-status";

type Props = { params: Promise<{ id: string }> };

export default async function OrdenAdmin({ params }: Props) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  if (!o) notFound();
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id));
  const wa = customerWhatsapp(o.customerPhone, o.customerName, orderStatusMessage(o.status, o.code, o.deliveryMethod) ?? `Es por tu orden ${o.code}.`);

  return (
    <>
      <nav className="tp-breadcrumb">
        <Link href="/admin/ordenes/">Órdenes</Link>
        <span>/</span>
        <span>{o.code}</span>
      </nav>
      <div className="tp-admin-title">
        <h1 className="tp-display">{o.code}</h1>
        <StatusBadge status={o.status} />
      </div>

      {o.stockStatus==="review"&&<section className="tp-panel"><h2>Pago recibido: revisar existencias</h2><p>La reserva venció o no había unidades disponibles al confirmar el pago. Coordina la solución con el cliente antes de entregar. Si repones el producto, puedes volver a comprobar y asignar las unidades.</p><form action={resolvePaidStock}><input type="hidden" name="id" value={o.id}/><button className="tp-btn tp-btn-primary">Comprobar y asignar existencias</button></form></section>}
      <div className="tp-two-col">
        <div className="tp-panel tp-stack">
          {items.map((i) => (
            <div key={i.id} className="tp-summary-row">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span>{formatCLP(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
          <div className="tp-summary-row">
            <span>Subtotal</span>
            <span>{formatCLP(o.subtotal)}</span>
          </div>
          <div className="tp-summary-row">
            <span>Despacho</span>
            <span>{formatCLP(o.shipping)}</span>
          </div>
          <div className="tp-summary-total">
            <span>Total</span>
            <strong>{formatCLP(o.total)}</strong>
          </div>
        </div>

        <div className="tp-stack">
          <div className="tp-panel">
            <dl className="tp-dl tp-small">
              <div>
                <dt>Cliente</dt>
                <dd>{o.customerName}</dd>
              </div>
              <div>
                <dt>Celular</dt>
                <dd>
                  <a href={wa} target="_blank" rel="noopener" className="tp-orange">
                    {displayPhone(o.customerPhone)}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{o.customerEmail}</dd>
              </div>
              <div>
                <dt>Entrega</dt>
                <dd>{o.deliveryMethod === "retiro" ? deliveryLabel(o) : `${o.address}, ${o.commune}`}</dd>
              </div>
              {o.notes && (
                <div>
                  <dt>Notas</dt>
                  <dd>{o.notes}</dd>
                </div>
              )}
              <div>
                <dt>Pago</dt>
                <dd>
                  {paymentLabel(o.paymentMethod)}
                  {o.authorizationCode ? ` · aut. ${o.authorizationCode}` : ""}
                </dd>
              </div>
              <div>
                <dt>Creada</dt>
                <dd>{formatDateTime(o.createdAt)}</dd>
              </div>
              {o.paidAt && (
                <div>
                  <dt>Pagada</dt>
                  <dd>{formatDateTime(o.paidAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          <OrderStatusForm id={o.id} status={o.status} options={orderTransitions[o.status] ?? []} />
        </div>
      </div>
    </>
  );
}
