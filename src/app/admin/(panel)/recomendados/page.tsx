import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { RecommendationForm } from "@/components/admin/RecommendationForm";

export const dynamic = "force-dynamic";
export default async function RecommendationsAdmin() {
  await requireAdmin();
  const items = await db.select().from(schema.recommendations).orderBy(desc(schema.recommendations.createdAt));
  return <div className="tp-stack"><h1>Recomendados de Mercado Libre</h1><p>Agrega tus enlaces de afiliado y explica por qué recomiendas cada producto. Desmarca Publicar para ocultar una recomendación.</p><RecommendationForm />{items.map(item => <RecommendationForm key={item.id} item={item} />)}</div>;
}
