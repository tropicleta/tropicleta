import type { Metadata } from "next";
import Link from "next/link";
import { getRecommendations } from "@/lib/queries";
import { ShopSections } from "@/components/shop/ShopSections";
import { isMercadoLibreUrl } from "@/lib/affiliate-validation";
import { siteUrl } from "@/lib/site-url";
import { formatCLP } from "@/lib/format";
import { CatalogSearch } from "@/components/CatalogSearch";
import { SortSelect } from "@/components/shop/SortSelect";
import { CategorySelect } from "@/components/shop/CategorySelect";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { matchesSearch } from "@/lib/catalog-search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recomendados en Mercado Libre", description: "Productos seleccionados por Tropicleta para cuidar tu bicicleta y disfrutar tus salidas. Compra directamente en Mercado Libre.", alternates: { canonical: siteUrl("/recomendados/") } };

export default async function RecommendationsPage({ searchParams }: { searchParams: Promise<{ categoria?: string; orden?: string; q?: string; p?: string }> }) {
  const { categoria, orden, q, p } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  const sort = orden === "precio-asc" || orden === "precio-desc" ? orden : "recientes";
  const all = (await getRecommendations()).filter(item => isMercadoLibreUrl(item.url));
  const pageSize=12;
  const pageNumber=Math.max(1,Math.min(10000,Number.parseInt(p||"1",10)||1));
  const categories = [...new Set(all.map(item => item.category))];
  const items = all.filter(item => (!categoria || item.category === categoria) && matchesSearch(query, item.name, item.category));
  if (sort !== "recientes") items.sort((a, b) => {
    if (a.price == null) return b.price == null ? 0 : 1;
    if (b.price == null) return -1;
    return sort === "precio-asc" ? a.price - b.price : b.price - a.price;
  });
  const totalPages=Math.max(1,Math.ceil(items.length/pageSize)),currentPage=Math.min(pageNumber,totalPages);
  const visibleItems=items.slice((currentPage-1)*pageSize,currentPage*pageSize);
  const pageUrl=(n:number)=>`/recomendados/?${new URLSearchParams({...(categoria?{categoria}:{}),...(query?{q:query}:{}),orden:sort,p:String(n)})}`;
  return <>
    <section className="tp-hero tp-page-hero"><div className="tp-shell">
      <span className="tp-kicker">La selección de Tropicleta</span>
      <h1 className="tp-display">Para tu próxima <span>salida.</span></h1>
      <p className="tp-hero-copy">Accesorios, herramientas y equipo que recomendamos. Descubre por qué los elegimos y compra directamente en Mercado Libre.</p>
      {totalPages>1&&<nav aria-label="Páginas de recomendados" className="tp-actions" style={{marginTop:24}}>{currentPage>1&&<Link className="tp-btn tp-btn-secondary" href={pageUrl(currentPage-1)}>Anterior</Link>}<span>Página {currentPage} de {totalPages}</span>{currentPage<totalPages&&<Link className="tp-btn tp-btn-secondary" href={pageUrl(currentPage+1)}>Siguiente</Link>}</nav>}
    </div></section>
    <section className="tp-section tp-recommendations"><div className="tp-shell">
      <ShopSections current="recomendados" />
      <div className="tp-panel" style={{ marginBottom: 24 }}><strong>Compras en Mercado Libre</strong><p>Estos productos no se agregan al carrito de Tropicleta. El precio, stock, envío, cambios y garantía los informa Mercado Libre y el vendedor de cada publicación.</p><p className="tp-hint">Enlaces de afiliado: Tropicleta puede recibir una comisión si compras a través de estos enlaces.</p></div>
      <CatalogSearch action="/recomendados/" query={query} label="Buscar recomendados" placeholder="Ej.: cadena, frenos, luces…" hidden={{ categoria, orden: sort }} />
      <div className="tp-shop-toolbar">
        <CategorySelect categories={categories} value={categoria} />
        <SortSelect value={sort} />
      </div>
      <p className="tp-catalog-count">{items.length} {items.length === 1 ? "recomendación" : "recomendaciones"}{query ? ` para “${query}”` : ""}</p>
      {items.length ? <div className="tp-product-grid" style={{ marginTop: 24 }}>{visibleItems.map(item => <article className="tp-product-card tp-recommendation-card" key={item.id}>
        <ProductMedia name={item.name} image={item.imageUrl} />
        <div className="tp-product-body">
          <h2 className="tp-product-name" title={item.name}>{item.name}</h2>
          {item.price != null && <div className="tp-product-price" title="Precio referencial en Mercado Libre">{formatCLP(item.price)}</div>}
          <a className="tp-btn tp-btn-primary" href={item.url} target="_blank" rel="sponsored nofollow noopener noreferrer">Ver en Mercado Libre ↗</a>
        </div>
      </article>)}</div> : <div className="tp-catalog-empty"><h2>{query ? "No encontramos recomendaciones" : categoria ? "No hay recomendaciones en esta categoría" : "Estamos preparando nuestra selección"}</h2><p>{query ? "Prueba con otra palabra o explora todos los recomendados." : "Pronto compartiremos productos con recomendaciones útiles para tus salidas."}</p><Link className="tp-btn tp-btn-secondary" href={categoria || query ? "/recomendados/" : "/tienda/"}>{categoria || query ? "Ver todos los recomendados" : "Explorar la tienda Tropicleta"}</Link></div>}
    </div></section>
  </>;
}
