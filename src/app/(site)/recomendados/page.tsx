import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ShopSections } from "@/components/shop/ShopSections";
import { isMercadoLibreUrl } from "@/lib/affiliate-validation";
import { siteUrl } from "@/lib/site-url";
import { formatCLP } from "@/lib/format";
import { CatalogSearch } from "@/components/CatalogSearch";
import { SortSelect } from "@/components/shop/SortSelect";
import { matchesSearch } from "@/lib/catalog-search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recomendados en Mercado Libre", description: "Productos seleccionados por Tropicleta para cuidar tu bicicleta y disfrutar tus salidas. Compra directamente en Mercado Libre.", alternates: { canonical: siteUrl("/recomendados/") } };

export default async function RecommendationsPage({ searchParams }: { searchParams: Promise<{ categoria?: string; orden?: string; q?: string }> }) {
  const { categoria, orden, q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  const sort = orden === "precio-asc" || orden === "precio-desc" ? orden : "recientes";
  const all = (await db.select().from(schema.recommendations).where(eq(schema.recommendations.active, true)).orderBy(desc(schema.recommendations.createdAt))).filter(item => isMercadoLibreUrl(item.url));
  const categories = [...new Set(all.map(item => item.category))];
  const items = all.filter(item => (!categoria || item.category === categoria) && matchesSearch(query, item.name, item.category));
  if (sort !== "recientes") items.sort((a, b) => {
    if (a.price == null) return b.price == null ? 0 : 1;
    if (b.price == null) return -1;
    return sort === "precio-asc" ? a.price - b.price : b.price - a.price;
  });
  const href = (category?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("categoria", category);
    if (query) params.set("q", query);
    if (sort !== "recientes") params.set("orden", sort);
    return `/recomendados/${params.size ? "?" + params.toString() : ""}`;
  };
  return <>
    <section className="tp-hero tp-page-hero"><div className="tp-shell">
      <span className="tp-kicker">La selección de Tropicleta</span>
      <h1 className="tp-display">Para tu próxima <span>salida.</span></h1>
      <p className="tp-hero-copy">Accesorios, herramientas y equipo que recomendamos. Descubre por qué los elegimos y compra directamente en Mercado Libre.</p>
    </div></section>
    <section className="tp-section tp-recommendations"><div className="tp-shell">
      <ShopSections current="recomendados" />
      <div className="tp-panel" style={{ marginBottom: 24 }}><strong>Compras en Mercado Libre</strong><p>Estos productos no se agregan al carrito de Tropicleta. El precio, stock, envío, cambios y garantía los informa Mercado Libre y el vendedor de cada publicación.</p><p className="tp-hint">Enlaces de afiliado: Tropicleta puede recibir una comisión si compras a través de estos enlaces.</p></div>
      <CatalogSearch action="/recomendados/" query={query} label="Buscar recomendados" placeholder="Ej.: cadena, frenos, luces…" hidden={{ categoria, orden: sort }} />
      <div className="tp-shop-toolbar">
        {categories.length > 0 && <nav className="tp-chip-nav" aria-label="Categorías de recomendados"><Link className="tp-chip" href={href()} aria-current={!categoria ? "page" : undefined}>Todos</Link>{categories.map(category => <Link className="tp-chip" key={category} href={href(category)} aria-current={categoria === category ? "page" : undefined}>{category}</Link>)}</nav>}
        <SortSelect value={sort} />
      </div>
      <p className="tp-catalog-count">{items.length} {items.length === 1 ? "recomendación" : "recomendaciones"}{query ? ` para “${query}”` : ""}</p>
      {items.length ? <div className="tp-product-grid tp-recommendation-grid" style={{ marginTop: 24 }}>{items.map(item => <article className="tp-panel tp-stack" key={item.id}>
        {item.imageUrl && <img src={item.imageUrl} alt={item.name} width={480} height={320} loading="lazy" referrerPolicy="no-referrer" style={{ width: "100%", height: 220, objectFit: "contain", background: "#fff", borderRadius: "var(--tp-radius)" }} />}
        <span className="tp-kicker">{item.category}</span><h2>{item.name}</h2>
        {item.price != null && <p><strong style={{ fontSize: "1.4rem" }}>{formatCLP(item.price)}</strong><span className="tp-hint" style={{ display: "block" }}>Precio referencial · puede cambiar en Mercado Libre</span></p>}
        <a className="tp-btn tp-btn-primary" href={item.url} target="_blank" rel="sponsored nofollow noopener noreferrer">Ver en Mercado Libre ↗</a>
      </article>)}</div> : <div className="tp-catalog-empty"><h2>{query ? "No encontramos recomendaciones" : categoria ? "No hay recomendaciones en esta categoría" : "Estamos preparando nuestra selección"}</h2><p>{query ? "Prueba con otra palabra o explora todos los recomendados." : "Pronto compartiremos productos con recomendaciones útiles para tus salidas."}</p><Link className="tp-btn tp-btn-secondary" href={categoria || query ? "/recomendados/" : "/tienda/"}>{categoria || query ? "Ver todos los recomendados" : "Explorar la tienda Tropicleta"}</Link></div>}
    </div></section>
  </>;
}
