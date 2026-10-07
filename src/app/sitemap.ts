import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { siteUrl } from "@/lib/site-url";
import { posts } from "@/data/posts";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["/", "/servicios/", "/tienda/", "/recomendados/", "/contacto/", "/nosotros/", "/eventos/", "/consejos/", "/calculador-sag/", "/biometria/", "/preguntas-frecuentes/", "/garantia/", "/envios-y-devoluciones/", "/terminos/", "/privacidad/"].map((p) => ({
    url: siteUrl(p),
    changeFrequency: "weekly" as const,
    priority: p === "/" ? 1 : 0.8,
  }));
  try {
    const [services, products] = await Promise.all([
      db.select({ slug: schema.services.slug }).from(schema.services).where(eq(schema.services.active, true)),
      db.select({ slug: schema.products.slug }).from(schema.products).where(eq(schema.products.active, true)),
    ]);
    return [
      ...staticPages,
      ...services.map((s) => ({ url: siteUrl(`/servicios/${s.slug}/`), priority: 0.6 })),
      ...products.map((p) => ({ url: siteUrl(`/tienda/${p.slug}/`), priority: 0.5 })),
      ...posts.map((p) => ({ url: siteUrl(`/consejos/${p.slug}/`), lastModified: p.date, priority: 0.5 })),
    ];
  } catch {
    return staticPages;
  }
}
