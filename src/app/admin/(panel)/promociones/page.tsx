import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PromotionForm } from "@/components/admin/PromotionForm";
import { togglePromotion } from "@/actions/promotions";
import { promotionIsValid } from "@/lib/promotion";
export default async function PromotionsPage() {
  await requireAdmin();
  const promotions = await db.select().from(schema.promotions).orderBy(schema.promotions.code);
  return <><h1>Promociones</h1><p>Crea un código y compártelo con quienes comenten en Instagram. Podrán ingresarlo en el paso 3 de la cotización.</p><PromotionForm /><section className="tp-panel"><h2>Tus códigos</h2>{!promotions.length && <p>Aún no hay códigos. Crea el primero arriba.</p>}{promotions.map(p => <article key={p.code} className="tp-panel"><h3>{p.code} · {p.percent}%</h3><p>{promotionIsValid(p) ? "Activo" : p.active ? "Vencido" : "Desactivado"} · {p.expiresOn ? `Vigente hasta ${p.expiresOn} (hora de Chile)` : "Sin vencimiento"}</p><form action={togglePromotion}><input type="hidden" name="code" value={p.code} /><input type="hidden" name="active" value={String(!p.active)} /><button className="tp-btn tp-btn-secondary" type="submit">{p.active ? "Desactivar" : "Activar"}</button></form></article>)}</section></>;
}
