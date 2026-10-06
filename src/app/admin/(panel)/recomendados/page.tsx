import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { RecommendationForm } from "@/components/admin/RecommendationForm";

export const dynamic = "force-dynamic";
export default async function RecommendationsAdmin() {
  await requireAdmin();
  const items = await db.select().from(schema.recommendations).orderBy(desc(schema.recommendations.createdAt));
  return (
    <div className="tp-stack">
      <h1>Recomendados de Mercado Libre</h1>
      <p>Abre una recomendación para editarla. Desmarca Publicar para ocultarla de la página.</p>
      <details className="tp-panel">
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>Nueva recomendación</summary>
        <RecommendationForm />
      </details>
      <p className="tp-hint">{items.length} recomendaciones · {items.filter(item => item.active).length} publicadas</p>
      {items.map(item => (
        <details key={item.id} className="tp-panel">
          <summary style={{ cursor: "pointer" }}>
            <strong>{item.name}</strong>{" · "}
            <span className="tp-muted">{item.category}</span>{" · "}
            <span className={`tp-badge${item.active ? " tp-badge-orange" : ""}`}>{item.active ? "Publicado" : "Oculto"}</span>
          </summary>
          <RecommendationForm item={item} />
        </details>
      ))}
    </div>
  );
}
