import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/AddToCart";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { getProduct } from "@/lib/queries";
import { formatCLP } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Producto no encontrado" };
  return {
    alternates: { canonical: siteUrl(`/tienda/${data.product.slug}/`) },
    title: data.product.name,
    description: data.product.description ?? undefined,
    openGraph: data.product.images[0] ? { images: [data.product.images[0]] } : undefined,
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();
  const { product: p, category } = data;
  const onSale = p.compareAtPrice && p.compareAtPrice > p.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images,
    description: p.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "CLP",
      price: p.price,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <section className="tp-section" style={{ paddingTop: 40 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="tp-shell">
        <nav className="tp-breadcrumb" aria-label="Ruta">
          <Link href="/tienda/">Tienda</Link>
          {category && (
            <>
              <span>/</span>
              <Link href={`/tienda/?categoria=${category.slug}`}>{category.name}</Link>
            </>
          )}
        </nav>

        <div className="tp-two-col tp-two-col-even">
          <ProductGallery name={p.name} images={p.images} />

          <div>
            {category && <span className="tp-kicker">{category.name}</span>}
            <h1 className="tp-display tp-section-title">{p.name}</h1>
            <div className="tp-price" style={{ fontSize: 48, margin: "8px 0 14px" }}>
              {formatCLP(p.price)}
              {onSale && (
                <s className="tp-muted" style={{ fontSize: 18, marginLeft: 10, fontFamily: "var(--font-body)" }}>
                  {formatCLP(p.compareAtPrice!)}
                </s>
              )}
            </div>
            <p style={{ marginBottom: 20 }}>
              {p.stock > 0 ? (
                <span className="tp-badge tp-badge-green">{p.stock <= 3 ? `Últimas ${p.stock} unidades` : "Disponible"}</span>
              ) : (
                <span className="tp-badge tp-badge-red">Agotado</span>
              )}
            </p>
            {p.description && (
              <p className="tp-section-intro" style={{ whiteSpace: "pre-line" }}>
                {p.description}
              </p>
            )}
            <AddToCart product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, stock: p.stock, image: p.images[0] }} />
            <ul className="tp-check-list tp-small" style={{ marginTop: 26 }}>
              <li>Retiro gratis en el taller (Tierra Amarilla)</li>
              <li>Despacho a Tierra Amarilla, Paipote y Copiapó</li>
              <li>Pago con Mercado Pago</li>
            </ul>

          </div>
        </div>
      </div>
    </section>
  );
}
