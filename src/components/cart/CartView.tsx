"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { QtyControl } from "./QtyControl";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { formatCLP } from "@/lib/format";

export function CartView() {
  const { items, subtotal, setQuantity, remove, ready } = useCart();
  if (!ready) return <div className="tp-panel tp-empty">Cargando…</div>;

  if (!items.length) {
    return (
      <div className="tp-panel tp-empty">
        <p style={{ margin: 0 }}>Tu carrito está vacío.</p>
        <Link className="tp-btn tp-btn-primary" href="/tienda/">
          Ver tienda
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className="tp-two-col">
      <div className="tp-panel">
        {items.map((i) => (
          <div key={i.productId} className="tp-cart-line">
            <div className="tp-cart-thumb">
              <ProductMedia name={i.name} image={i.image} sizes="64px" />
            </div>
            <div>
              <div className="tp-cart-line-top">
                <Link href={`/tienda/${i.slug}/`}>{i.name}</Link>
                <span>{formatCLP(i.price * i.quantity)}</span>
              </div>
              <div className="tp-cart-line-bottom">
                <QtyControl value={i.quantity} max={Math.min(i.stock, 10)} onChange={(v) => setQuantity(i.productId, v)} label={i.name} />
                <button type="button" className="tp-link-btn" onClick={() => remove(i.productId)}>
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className="tp-panel tp-stack tp-sticky">
        <div className="tp-summary-total">
          <span>Subtotal</span>
          <strong>{formatCLP(subtotal)}</strong>
        </div>
        <p className="tp-hint" style={{ margin: 0 }}>
          Retiro gratis. Reparto: Tierra Amarilla $3.000, Paipote $5.000 y Copiapó $8.000. Elige tu zona al finalizar la compra.
        </p>
        <Link className="tp-btn tp-btn-primary tp-btn-block" href="/checkout/">
          Ir a pagar
        </Link>
        <Link className="tp-btn tp-btn-ghost tp-btn-block" href="/tienda/">
          Seguir comprando
        </Link>
      </aside>
    </div>
    </>
  );
}
