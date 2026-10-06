import Link from "next/link";

export function ShopSections({ current }: { current: "tienda" | "recomendados" }) {
  return <nav className="tp-chip-nav" aria-label="Dónde comprar" style={{ marginBottom: 24 }}>
    <Link className="tp-chip" href="/tienda/" aria-current={current === "tienda" ? "page" : undefined}>Tienda · Compra en Tropicleta</Link>
    <Link className="tp-chip" href="/recomendados/" aria-current={current === "recomendados" ? "page" : undefined}>Recomendados · Mercado Libre ↗</Link>
  </nav>;
}
