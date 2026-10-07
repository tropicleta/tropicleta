import Link from "next/link";

export function ShopSections({ current }: { current: "tienda" | "recomendados" }) {
  return <nav className="tp-shop-sections" aria-label="Dónde comprar">
    <Link className="tp-shop-section" href="/tienda/" aria-current={current === "tienda" ? "page" : undefined}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>
      <span><strong>Tienda Tropicleta</strong><small>Compra aquí · Añade productos a tu carrito</small></span>
      <span className="tp-shop-section-arrow" aria-hidden="true">→</span>
    </Link>
    <Link className="tp-shop-section" href="/recomendados/" aria-current={current === "recomendados" ? "page" : undefined}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>
      <span><strong>Recomendados</strong><small>Elegidos por Tropicleta · Compra en Mercado Libre</small></span>
      <span className="tp-shop-section-arrow" aria-hidden="true">→</span>
    </Link>
  </nav>;
}
