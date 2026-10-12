import Link from "next/link";

export function ShopSections({ current, showcase = true, recommendationPreview }: { current?: "tienda" | "recomendados"; showcase?: boolean; recommendationPreview?: { image: string; name: string } }) {
  if (current) return <nav className="tp-shop-sections tp-shop-showcase tp-shop-catalog-cards" aria-label="Dónde comprar">
    <Link className="tp-shop-section tp-shop-direct" href="/tienda/" aria-current={current === "tienda" ? "page" : undefined}>
      <span className="tp-shop-brand-visual"><img src="/brand/wordmark-stacked.webp" alt="Tropicleta" width="700" height="473" /></span>
      <span><strong>Tienda Tropicleta</strong><small>Compra directamente en el taller</small></span>
      <span className="tp-shop-section-arrow" aria-hidden="true">→</span>
    </Link>
    <Link className="tp-shop-section tp-shop-curated" href="/recomendados/" aria-current={current === "recomendados" ? "page" : undefined}>
      <span className="tp-shop-brand-visual"><span className="tp-shop-market-logo"><img src="/brand/mercado-libre-wordmark.svg" alt="Mercado Libre" width="92" height="40" /></span></span>
      <span><strong>Recomendados</strong><small>Elegidos por Tropicleta · Compra en Mercado Libre</small></span>
      <span className="tp-shop-section-arrow" aria-hidden="true">↗</span>
    </Link>
  </nav>;
  return <nav className={`tp-shop-sections tp-shop-showcase${current ? " tp-shop-catalog-cards" : ""}`} aria-label="Dónde comprar">
    <Link className="tp-shop-section tp-shop-direct" href="/tienda/" aria-current={current === "tienda" ? "page" : undefined}>
      {showcase ? <span className="tp-shop-brand-visual"><img src="/brand/wordmark-stacked.webp" alt="Tropicleta" width="700" height="473" /><img className="tp-shop-product-preview" src="/productos/racelub-clean-80ml-frente.png" alt="Lubricante disponible en el taller" width="90" height="100" loading="lazy" /></span> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>}
      <span className="tp-shop-copy">{showcase && <span className="tp-shop-eyebrow">Tienda Tropicleta</span>}<strong>{showcase ? "Lo que tu bici necesita" : "Tienda Tropicleta"}</strong><small>{showcase ? "Neumáticos, lubricantes y cuidados disponibles en el taller." : "Compra aquí · Añade productos a tu carrito"}</small>{showcase && <span className="tp-shop-cta">Explorar la tienda <span aria-hidden="true">→</span></span>}</span>
      <span className="tp-shop-section-arrow" aria-hidden="true">→</span>
    </Link>
    <Link className="tp-shop-section tp-shop-curated" href="/recomendados/" aria-current={current === "recomendados" ? "page" : undefined}>
      {showcase ? <span className="tp-shop-brand-visual"><span className="tp-shop-market-logo"><img src="/brand/mercado-libre-wordmark.svg" alt="Mercado Libre" width="92" height="40" /></span>{recommendationPreview && <img className="tp-shop-product-preview" src={recommendationPreview.image} alt={recommendationPreview.name} width="90" height="100" loading="lazy" referrerPolicy="no-referrer" />}</span> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>}
      <span className="tp-shop-copy">{showcase && <span className="tp-shop-eyebrow">Recomendados por Tropicleta</span>}<strong>{showcase ? "Encuentra tu próximo accesorio" : "Recomendados"}</strong><small>{showcase ? "Repuestos y equipo elegidos en el taller. Compra en Mercado Libre." : "Elegidos por Tropicleta · Compra en Mercado Libre"}</small>{showcase && <span className="tp-shop-cta">Explorar recomendados <span aria-hidden="true">↗</span></span>}</span>
      <span className="tp-shop-section-arrow" aria-hidden="true">→</span>
    </Link>
  </nav>;
}
