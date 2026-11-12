import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, ne } from "drizzle-orm";
import { Pager, SearchBar } from "@/components/admin/ListControls";
import { StatusBadge, statusLabel } from "@/components/admin/StatusBadge";
import { db, schema } from "@/db";
import { PAGE_SIZE, pageFrom, searchWhere } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { deliveryLabel, formatCLP, formatDateTime, paymentLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Órdenes" };

type Props = { searchParams: Promise<{ estado?: string; q?: string; p?: string }> };

export default async function OrdenesAdmin({ searchParams }: Props) {
  await requireAdmin();
  const { estado, q, p } = await searchParams;
  const page = pageFrom(p);
  const t = schema.orders;
  const valid = t.status.enumValues.includes(estado as never);
  const where = and(
    // Por defecto se ocultan los intentos de pago abandonados
    valid ? eq(t.status, estado as never) : ne(t.status, "anulada"),
    searchWhere(q, [t.code, t.customerName, t.customerEmail], [t.customerPhone]),
  );
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(t).where(where).orderBy(desc(t.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(t).where(where),
  ]);

  return (
    <>
      <div className="tp-admin-title">
        <h1 className="tp-display">Órdenes</h1>
      </div>
      <nav className="tp-chip-nav" aria-label="Filtrar por estado">
        <Link className="tp-chip" href={`/admin/ordenes/${q ? `?q=${encodeURIComponent(q)}` : ""}`} aria-current={!valid ? "true" : undefined}>
          Activas
        </Link>
        {schema.orderStatus.enumValues.map((s) => (
          <Link key={s} className="tp-chip" href={`/admin/ordenes/?${new URLSearchParams({ estado: s, ...(q ? { q } : {}) })}`} aria-current={estado === s ? "true" : undefined}>
            {statusLabel[s]}
          </Link>
        ))}
      </nav>
      <SearchBar q={q} placeholder="Código, cliente, celular o email" keep={{ estado: valid ? estado : undefined }} />
      <div className="tp-table-wrap">
        <table className="tp-table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Cliente</th>
              <th>Entrega</th>
              <th>Pago</th>
              <th className="num">Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/admin/ordenes/${o.id}/`}>{o.code}</Link>
                  <br />
                  <span className="tp-hint">{formatDateTime(o.createdAt)}</span>
                </td>
                <td>{o.customerName}</td>
                <td>{deliveryLabel(o)}</td>
                <td>{paymentLabel(o.paymentMethod)}</td>
                <td className="num">{formatCLP(o.total)}</td>
                <td>
                  <StatusBadge status={o.status} />{o.stockStatus==="review"&&<strong className="tp-orange"> Revisar stock</strong>}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="tp-muted">
                  No hay órdenes.
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
