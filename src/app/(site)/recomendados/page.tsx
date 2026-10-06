import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ShopSections } from "@/components/shop/ShopSections";
import { isMercadoLibreUrl } from "@/lib/affiliate-validation";
import { siteUrl } from "@/lib/site-url";
import { formatCLP } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recomendados en Mercado Libre", description: "Productos seleccionados por Tropicleta para cuidar tu bicicleta y disfrutar tus salidas. Compra directamente en Mercado Libre.", alternates: { canonical: siteUrl("/recomendados/") } };

export default async function RecommendationsPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const all = (await db.select().from(schema.recommendations).where(eq(schema.recommendations.active, true)).orderBy(desc(schema.recommendations.createdAt))).filter(item => isMercadoLibreUrl(item.url));
  const categories = [...new Set(all.map(item => item.category))];
  const items = categoria ? all.filter(item => item.category === categoria) : all;
  return <>
    <section className="tp-hero tp-page-hero"><div className="tp-shell">
      <span className="tp-kicker">La selección de Tropicleta</span>
      <h1 className="tp-display">Para tu próxima <span>salida.</span></h1>
      <p className="tp-hero-copy">Accesorios, herramientas y equipo que recomendamos. Descubre por qué los elegimos y compra directamente en Mercado Libre.</p>
    </div></section>
    <section className="tp-section"><div className="tp-shell">
      <ShopSections current="recomendados" />
      <div className="tp-panel" style={{ marginBottom: 24 }}><strong>Compras en Mercado Libre</strong><p>Estos productos no se agregan al carrito de Tropicleta. El precio, stock, envío, cambios y garantía los informa Mercado Libre y el vendedor de cada publicación.</p><p className="tp-hint">Enlaces de afiliado: Tropicleta puede recibir una comisión si compras a través de estos enlaces.</p></div>
      {categories.length > 0 && <nav className="tp-chip-nav" aria-label="Categorías de recomendados"><Link className="tp-chip" href="/recomendados/" aria-current={!categoria ? "page" : undefined}>Todos</Link>{categories.map(category => <Link className="tp-chip" key={category} href={`/recomendados/?categoria=${encodeURIComponent(category)}`} aria-current={categoria === category ? "page" : undefined}>{category}</Link>)}</nav>}
      {items.length ? <div className="tp-product-grid" style={{ marginTop: 24 }}>{items.map(item => <article className="tp-panel tp-stack" key={item.id}>
        {item.imageUrl && <img src={item.imageUrl} alt={item.name} width={480} height={320} loading="lazy" referrerPolicy="no-referrer" style={{ width: "100%", height: 220, objectFit: "contain", background: "#fff", borderRadius: 12 }} />}
        <span className="tp-kicker">{item.category}</span><h2>{item.name}</h2>
        {item.price != null && <p><strong style={{ fontSize: "1.4rem" }}>{formatCLP(item.price)}</strong><span className="tp-hint" style={{ display: "block" }}>Precio referencial · puede cambiar en Mercado Libre</span></p>}
        <p>{item.reason}</p><p className="tp-hint">Confirma precio y disponibilidad en la publicación.</p>
        <a className="tp-btn tp-btn-primary" href={item.url} target="_blank" rel="sponsored nofollow noopener noreferrer">Ver en Mercado Libre ↗</a>
      </article>)}</div> : <div className="tp-catalog-empty"><h2>{categoria ? "No hay recomendaciones en esta categoría" : "Estamos preparando nuestra selección"}</h2><p>Pronto compartiremos productos con recomendaciones útiles para tus salidas.</p><Link className="tp-btn tp-btn-secondary" href={categoria ? "/recomendados/" : "/tienda/"}>{categoria ? "Ver todos los recomendados" : "Explorar la tienda Tropicleta"}</Link></div>}
    </div></section>
  </>;
}
