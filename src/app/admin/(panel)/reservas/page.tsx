import type { Metadata } from "next";
import { BookingServices } from "@/components/BookingServices";
import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { updateBookingStatus } from "@/actions/admin";
import { Pager, SearchBar } from "@/components/admin/ListControls";
import { StatusBadge, statusLabel } from "@/components/admin/StatusBadge";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { db, schema } from "@/db";
import { PAGE_SIZE, pageFrom, searchWhere } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { displayPhone, formatCLP, formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Reservas" };

type Props = { searchParams: Promise<{ estado?: string; q?: string; p?: string }> };

export default async function ReservasAdmin({ searchParams }: Props) {
  await requireAdmin();
  const { estado, q, p } = await searchParams;
  const page = pageFrom(p);
  const t = schema.bookings;
  const valid = t.status.enumValues.includes(estado as never);
  const where = and(valid ? eq(t.status, estado as never) : undefined, searchWhere(q, [t.code, t.name, t.email], [t.phone]));
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(t).where(where).orderBy(desc(t.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(t).where(where),
  ]);

  return (
    <>
      <div className="tp-admin-title">
        <h1 className="tp-display">Reservas</h1>
      </div>
      <nav className="tp-chip-nav" aria-label="Filtrar por estado">
        <Link className="tp-chip" href={`/admin/reservas/${q ? `?q=${encodeURIComponent(q)}` : ""}`} aria-current={!valid ? "true" : undefined}>
          Todas
        </Link>
        {t.status.enumValues.map((s) => (
          <Link
            key={s}
            className="tp-chip"
            href={`/admin/reservas/?${new URLSearchParams({ estado: s, ...(q ? { q } : {}) })}`}
            aria-current={estado === s ? "true" : undefined}
          >
            {statusLabel[s]}
          </Link>
        ))}
      </nav>
      <SearchBar q={q} placeholder="Código, nombre, celular o email" keep={{ estado: valid ? estado : undefined }} />

      <div className="tp-table-wrap">
        <table className="tp-table">
          <thead>
            <tr>
              <th>Solicitud</th>
              <th>Cliente</th>
              <th>Servicios</th>
              <th>Preferencia</th>
              <th>Retiro</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link href={`/admin/reservas/${b.id}/`}>{b.code}</Link>
                  <br />
                  <span className="tp-hint">{formatDateTime(b.createdAt)}</span>
                </td>
                <td>
                  {b.name}
                  <br />
                  <span className="tp-hint">{displayPhone(b.phone)}</span>
                </td>
                <td>
                  <BookingServices booking={b} />
                  {b.quotedPrice != null && (
                    <>
                      <br />
                      <span className="tp-hint">Presupuesto {formatCLP(b.quotedPrice)}</span>
                    </>
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {formatDate(b.preferredDate)}
                  <br />
                  <span className="tp-hint">{b.timeSlot === "manana" ? "Mañana" : "Tarde"}</span>
                </td>
                <td>{b.pickup ? `${b.pickupCommune}: ${b.pickupAddress}` : "—"}</td>
                <td>
                  <StatusBadge status={b.status} />
                  <div style={{ marginTop: 8 }}>
                    <StatusSelect id={b.id} status={b.status} options={t.status.enumValues} action={updateBookingStatus} />
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="tp-muted">
                  No hay reservas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} total={total} pageSize={PAGE_SIZE} params={{ estado: valid ? estado : undefined, q }} />
    </>
  );
}
