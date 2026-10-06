import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { CatalogIcon } from "@/components/CatalogIcon";
import { CatalogSearch } from "@/components/CatalogSearch";
import { matchesSearch } from "@/lib/catalog-search";
import { whatsappUrl } from "@/lib/whatsapp";
import { ProductCard } from "@/components/shop/ProductCard";
import { SortSelect } from "@/components/shop/SortSelect";
import { ShopSections } from "@/components/shop/ShopSections";
import { getProductCategories, getProducts, type ProductSort } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/tienda/") },
  title: "Tienda",
  description: "Productos seleccionados para ciclistas, elegidos para complementar el trabajo del taller Tropicleta.",
};

type Props = { searchParams: Promise<{ categoria?: string; orden?: string; q?: string }> };
const sorts: ProductSort[] = ["recientes", "precio-asc", "precio-desc"];

export default async function TiendaPage({ searchParams }: Props) {
  const { categoria, orden, q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  const sort = sorts.includes(orden as ProductSort) ? (orden as ProductSort) : "recientes";
  const [categories, allProducts] = await Promise.all([getProductCategories(), getProducts({ category: categoria, sort })]);
  const products = allProducts.filter((p) => matchesSearch(query, p.name, p.description));

  const href = (cat?: string) => {
    const p = new URLSearchParams();
    if (cat) p.set("categoria", cat);
    if (query) p.set("q", query);
    if (sort !== "recientes") p.set("orden", sort);
    const q = p.toString();
    return `/tienda/${q ? "?" + q : ""}`;
  };

  return (
    <>
      <section className="tp-hero tp-page-hero">
        <div className="tp-shell" style={{ position: "relative", zIndex: 1 }}>
          <span className="tp-kicker">Tienda Tropicleta</span>
          <h1 className="tp-display">
            Productos <span>seleccionados.</span>
          </h1>
          <p className="tp-hero-copy">
            Repuestos, mantención y accesorios para tu bicicleta. Revisa la disponibilidad o consúltanos por la pieza que necesitas.
          </p>
        </div>
      </section>

      <section className="tp-section" style={{ paddingTop: 48 }}>
        <div className="tp-shell">
          <ShopSections current="tienda" />
          <CatalogSearch action="/tienda/" query={query} label="Buscar productos" placeholder="Ej.: cámara, lubricante, luces…" hidden={{ categoria, orden: sort }} />
          <div className="tp-shop-toolbar">
            <nav className="tp-chip-nav" aria-label="Categorías de productos">
              <Link className="tp-chip" href={href()} aria-current={!categoria ? "true" : undefined}>
                Todo
              </Link>
              {categories.map((c) => (
                <Link key={c.slug} className="tp-chip" href={href(c.slug)} aria-current={categoria === c.slug ? "true" : undefined}>
                  <CatalogIcon slug={c.slug} size={16} />
                  {c.name}
                </Link>
              ))}
            </nav>
            <SortSelect value={sort} />
          </div>
          <p className="tp-catalog-count">{products.length} {products.length === 1 ? "producto" : "productos"}{query ? ` para “${query}”` : ""}</p>

          {products.length ? (
            <div className="tp-product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="tp-catalog-empty">
              <div>
                <h2>{query ? "No encontramos ese producto" : "Consulta productos y disponibilidad"}</h2>
                <p>{query ? "Prueba con otra palabra o consulta por la pieza que buscas." : "Estamos preparando nuestro catálogo online. Escríbenos con el modelo de tu bicicleta y te ayudamos a encontrar lo que necesitas."}</p>
                <div className="tp-actions">
                  {(query || categoria) && <Link className="tp-btn tp-btn-secondary" href="/tienda/">Ver todo el catálogo</Link>}
                  <a className="tp-btn tp-btn-primary" href={whatsappUrl(`Hola Tropicleta, quiero consultar disponibilidad ${query ? `de ${query}` : "de repuestos y accesorios"}.`)} target="_blank" rel="noopener">Consultar por WhatsApp</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
