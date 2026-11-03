import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Tropibot } from "@/components/admin/Tropibot";
import { formatCLP } from "@/lib/format";

export default async function TropibotPage() {
  await requireAdmin();
  const [recent, stats] = await Promise.all([
    db.select().from(schema.tropibotRecords).orderBy(desc(schema.tropibotRecords.id)).limit(50),
    db.select({ origin: sql<string>`${schema.tropibotRecords.data}->>'origin'`, count: sql<number>`count(*)::int`, income: sql<number>`coalesce(sum(case when ${schema.cashEntries.voidedAt} is null then ${schema.cashEntries.amount} else 0 end),0)::bigint` })
      .from(schema.tropibotRecords).leftJoin(schema.cashEntries, eq(schema.tropibotRecords.cashEntryId, schema.cashEntries.id))
      .where(sql`${schema.tropibotRecords.data}->>'kind' != 'gasto'`).groupBy(sql`${schema.tropibotRecords.data}->>'origin'`),
  ]);
  return <><h1>Tropibot</h1><p>Tu libreta del taller: registra lo que haces y conoce de dónde llegan tus clientes.</p><Tropibot enabled={Boolean(process.env.OPENAI_API_KEY)} />
    <section className="tp-panel"><h2>Origen de los trabajos y ventas</h2><p className="tp-hint">Historial registrado en Tropibot. Cantidad de registros, no clientes únicos. Los cobros anulados no suman.</p><div className="tp-table-wrap"><table className="tp-table"><thead><tr><th>Origen</th><th>Trabajos / ventas</th><th>Cobrado</th></tr></thead><tbody>{stats.map(s => <tr key={s.origin}><td>{s.origin}</td><td>{s.count}</td><td>{formatCLP(Number(s.income))}</td></tr>)}{!stats.length && <tr><td colSpan={3}>Tus estadísticas aparecerán con el primer registro.</td></tr>}</tbody></table></div></section>
    <section className="tp-panel"><h2>Últimos 50 registros</h2><div className="tp-table-wrap"><table className="tp-table"><thead><tr><th>Fecha</th><th>Detalle</th><th>Origen</th><th>Monto</th><th>Registro de caja</th></tr></thead><tbody>{recent.map(r => <tr key={r.id}><td>{r.data.date}</td><td>{r.data.customer && `${r.data.customer} · `}{r.data.description}<br/><small>{r.data.kind}</small></td><td>{r.data.origin}<br/>{r.data.originDetail}</td><td>{formatCLP(r.data.amount)}</td><td>{r.cashEntryId ? <a href="/admin/contabilidad/">Ver en Contabilidad</a> : "Pendiente"}</td></tr>)}</tbody></table></div></section></>;
}
