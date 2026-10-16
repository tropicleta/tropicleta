import type { Metadata } from "next";
import { BookingServices } from "@/components/BookingServices";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateBookingStatus } from "@/actions/admin";
import { BookingDetailsForm, BookingPaymentForm } from "@/components/admin/BookingForms";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { db, schema } from "@/db";
import { localDate } from "@/lib/accounting-validation";
import { bookingPayments } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { displayPhone, formatCLP, formatDate, formatDateTime } from "@/lib/format";
import { bookingStatusMessage, customerWhatsapp } from "@/lib/order-status";

export const metadata: Metadata = { title: "Reserva" };

type Props = { params: Promise<{ id: string }> };

export default async function ReservaAdmin({ params }: Props) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id)).limit(1);
  if (!b) notFound();
  const payments = await bookingPayments(b.id);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const pending = b.quotedPrice != null ? Math.max(b.quotedPrice - paid, 0) : null;
  const waText = bookingStatusMessage(b.status, b.code) ?? `Es por tu solicitud ${b.code}.`;

  return (
    <>
      <nav className="tp-breadcrumb">
        <Link href="/admin/reservas/">Reservas</Link>
        <span>/</span>
        <span>{b.code}</span>
      </nav>
      <div className="tp-admin-title">
        <h1 className="tp-display">{b.code}</h1>
        <StatusBadge status={b.status} />
      </div>

      <div className="tp-two-col">
        <div className="tp-stack">
          <div className="tp-panel">
            <dl className="tp-dl tp-small">
              <div>
                <dt>Cliente</dt>
                <dd>{b.name}</dd>
              </div>
              <div>
                <dt>Celular</dt>
                <dd>
                  <a href={customerWhatsapp(b.phone, b.name, waText)} target="_blank" rel="noopener" className="tp-orange">
                    {displayPhone(b.phone)}
                  </a>
                </dd>
              </div>
              {b.email && (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${b.email}`}>{b.email}</a>
                  </dd>
                </div>
              )}
              <div>
                <dt>Servicios</dt>
                <dd><BookingServices booking={b} /></dd>
              </div>
              <div>
                <dt>Preferencia</dt>
                <dd>
                  {formatDate(b.preferredDate)}, {b.timeSlot === "manana" ? "mañana" : "tarde"}
                </dd>
              </div>
              <div>
                <dt>Retiro</dt>
                <dd>{b.pickup ? `${b.pickupCommune}: ${b.pickupAddress}` : "No"}</dd>
              </div>
              <div>
                <dt>Solicitada</dt>
                <dd>{formatDateTime(b.createdAt)}</dd>
              </div>
            </dl>
            {b.notes && <p className="tp-small" style={{ marginTop: 12, whiteSpace: "pre-line" }}>“{b.notes}”</p>}
          </div>

          <div className="tp-panel tp-stack">
            <strong>Estado</strong>
            <StatusSelect id={b.id} status={b.status} options={schema.bookingStatus.enumValues} action={updateBookingStatus} />
            <p className="tp-hint">
              Al confirmar, pasar a taller, lista o cancelada se envía un email al cliente (si dejó email).{" "}
              <a href={customerWhatsapp(b.phone, b.name, waText)} target="_blank" rel="noopener" className="tp-orange">
                Avisar por WhatsApp
              </a>
            </p>
          </div>

          <BookingDetailsForm id={b.id} internalNotes={b.internalNotes} quotedPrice={b.quotedPrice} />
        </div>

        <div className="tp-stack">
          <div className="tp-panel tp-stack">
            <strong>Cobros</strong>
            {payments.map((p) => (
              <div key={p.id} className="tp-summary-row">
                <span>
                  {formatDate(p.date)} · {p.method}
                </span>
                <span>{formatCLP(p.amount)}</span>
              </div>
            ))}
            {!payments.length && <p className="tp-muted tp-small">Sin cobros registrados.</p>}
            <div className="tp-summary-total">
              <span>Cobrado</span>
              <strong>{formatCLP(paid)}</strong>
            </div>
            {pending !== null && <p className="tp-hint">Pendiente según presupuesto: {formatCLP(pending)}</p>}
            <p className="tp-hint">
              Se registran en <Link href="/admin/contabilidad/">Contabilidad</Link> como ingreso “Taller”. Para corregir uno, anúlalo allí.
            </p>
          </div>
          <BookingPaymentForm id={b.id} today={localDate()} requestId={randomUUID()} suggested={pending || null} />
        </div>
      </div>
    </>
  );
}
