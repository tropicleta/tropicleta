import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";

export default async function VisitsPage() {
  await requireAdmin();
  const [totals, sources, pages, days] = await Promise.all([
    db.execute<{ visits: string; views: string }>(sql`select coalesce(sum(visits),0) as visits, coalesce(sum(views),0) as views from visit_daily where day >= (current_timestamp at time zone 'America/Santiago')::date - 29`),
    db.execute<{ source: string; campaign: string; visits: string }>(sql`select source, campaign, sum(visits) as visits from visit_daily where day >= (current_timestamp at time zone 'America/Santiago')::date - 29 group by source, campaign having sum(visits) > 0 order by sum(visits) desc limit 50`),
    db.execute<{ path: string; views: string }>(sql`select path, sum(views) as views from visit_daily where day >= (current_timestamp at time zone 'America/Santiago')::date - 29 group by path order by sum(views) desc limit 30`),
    db.execute<{ day: string; visits: string; views: string }>(sql`select day::text, sum(visits) as visits, sum(views) as views from visit_daily where day >= (current_timestamp at time zone 'America/Santiago')::date - 29 group by day order by day desc`),
  ]);
  return <>
    <div className="tp-admin-title"><h1 className="tp-display">Visitas</h1></div>
    <p>Últimos 30 días · horario de Chile. Actualiza la página para consultar los datos nuevos.</p>
    <div className="tp-stats"><div className="tp-stat"><strong>{Number(totals.rows[0].visits).toLocaleString("es-CL")}</strong><span>Visitas estimadas</span></div><div className="tp-stat"><strong>{Number(totals.rows[0].views).toLocaleString("es-CL")}</strong><span>Entradas registradas</span></div></div>
    <p className="tp-hint">Desde esta actualización se registra solo la entrada de cada visita, como máximo una cada 30 minutos por navegador. Las cifras históricas pueden incluir navegación interna. No representa personas únicas. No se guardan nombres, correos ni IP en las estadísticas. Bloqueadores, Do Not Track y fallos de conexión pueden reducir el conteo.</p>
    <section className="tp-panel" style={{ marginBlock: 24 }}><h2>Desde dónde llegan</h2><div className="tp-table-wrap"><table className="tp-table"><thead><tr><th>Origen</th><th>Campaña</th><th>Visitas</th></tr></thead><tbody>{sources.rows.map(row => <tr key={`${row.source}:${row.campaign}`}><td>{row.source}</td><td>{row.campaign || "—"}</td><td>{row.visits}</td></tr>)}{!sources.rows.length && <tr><td colSpan={3}>Aún no hay visitas registradas.</td></tr>}</tbody></table></div><p className="tp-hint">Directo / desconocido incluye enlaces que no informan su origen. Para identificar tus publicaciones usa, por ejemplo: https://tropicleta.com/?utm_source=instagram&amp;utm_campaign=perfil</p></section>
    <section className="tp-panel" style={{ marginBlock: 24 }}><h2>Páginas de entrada registradas</h2><div className="tp-table-wrap"><table className="tp-table"><thead><tr><th>Página</th><th>Vistas</th></tr></thead><tbody>{pages.rows.map(row => <tr key={row.path}><td>{row.path}</td><td>{row.views}</td></tr>)}{!pages.rows.length && <tr><td colSpan={2}>Aún no hay páginas registradas.</td></tr>}</tbody></table></div></section>
    <section className="tp-panel"><h2>Por día</h2><div className="tp-table-wrap"><table className="tp-table"><thead><tr><th>Fecha</th><th>Visitas</th><th>Páginas vistas</th></tr></thead><tbody>{days.rows.map(row => <tr key={row.day}><td>{row.day}</td><td>{row.visits}</td><td>{row.views}</td></tr>)}{!days.rows.length && <tr><td colSpan={3}>El registro comenzará al activar esta versión.</td></tr>}</tbody></table></div></section>
  </>;
}
