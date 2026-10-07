import Link from "next/link";
import type { Product } from "@/db/schema";
import { formatCLP } from "@/lib/format";
import { ProductMedia } from "./ProductMedia";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  return (
    <article className="tp-product-card">
      <ProductMedia
        name={product.name}
        image={product.images[0]}
        badge={
          soldOut ? (
            <span className="tp-badge">Agotado</span>
          ) : onSale ? (
            <span className="tp-badge tp-badge-orange">Oferta</span>
          ) : null
        }
      />
      <Link className="tp-product-body" href={`/tienda/${product.slug}/`}>
        <h3 className="tp-product-name" title={product.name}>{product.name}</h3>
        <div className="tp-product-price">
          {formatCLP(product.price)}
          {onSale && <s>{formatCLP(product.compareAtPrice!)}</s>}
        </div>
      </Link>
    </article>
  );
}
