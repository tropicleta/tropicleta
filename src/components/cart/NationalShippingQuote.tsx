"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";

export function NationalShippingQuote() {
  const { items, ready } = useCart();
  if (!ready || !items.length) return null;
  return <p id="envio-nacional" className="tp-hint" style={{ marginTop: 20 }}>
    Para envíos a otras comunas de Chile, consulta cobertura, costo y plazo antes de pagar en <Link href="/contacto/">Contacto</Link>. Tu carrito se conserva.
  </p>;
}
