import type { MetadataRoute } from "next";
import { getPublicSitemapSlugs } from "@/lib/queries";
import { siteUrl } from "@/lib/site-url";
import { posts } from "@/data/posts";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["/", "/servicios/", "/tienda/", "/recomendados/", "/contacto/", "/nosotros/", "/eventos/", "/extras/", "/juegos/tropi/index.html", "/consejos/", "/calculador-sag/", "/biometria/", "/preguntas-frecuentes/", "/garantia/", "/envios-y-devoluciones/", "/terminos/", "/privacidad/"].map((p) => ({
    url: siteUrl(p),
    changeFrequency: "weekly" as const,
    priority: p === "/" ? 1 : 0.8,
  }));
  const articles = posts.map((p) => ({ url: siteUrl(`/consejos/${p.slug}/`), lastModified: p.date, priority: 0.5 }));
  try {
    const { services, products } = await getPublicSitemapSlugs();
    return [
      ...staticPages,
      ...services.map((s) => ({ url: siteUrl(`/servicios/${s.slug}/`), priority: 0.6 })),
      ...products.map((p) => ({ url: siteUrl(`/tienda/${p.slug}/`), priority: 0.5 })),
      ...articles,
    ];
  } catch {
    return [...staticPages, ...articles];
  }
}
