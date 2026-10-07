"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { formatCLP } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";

export function NationalShippingQuote() {
  const { items, subtotal, ready } = useCart();
  const [region, setRegion] = useState("");
  const [commune, setCommune] = useState("");
  const [destination, setDestination] = useState("domicilio");
  if (!ready || !items.length) return null;

  return (
    <section id="envio-nacional" className="tp-panel tp-stack" style={{ marginTop: 24 }}>
      <h2 className="tp-label" style={{ margin: 0 }}>¿Tu pedido va a otra parte de Chile?</h2>
      <p style={{ margin: 0 }}>
        Cotizamos el envío según el destino, peso y tamaño del paquete. Primero confirmamos
        cobertura, transportista, costo y plazo estimado; después coordinamos el pago.
      </p>
      <form className="tp-form" onSubmit={(event) => {
        event.preventDefault();
        const message = [
          "Hola Tropicleta, quiero cotizar un envío nacional antes de comprar.",
          `Región: ${region.trim()}. Comuna: ${commune.trim()}.`,
          `Entrega preferida: ${destination === "domicilio" ? "a domicilio" : "retiro en sucursal"}, según cobertura.`,
          "Productos:",
          ...items.map((item) => `${item.quantity} × ${item.name} (${item.slug}) · ${formatCLP(item.price * item.quantity)}`),
          `Subtotal referencial de productos: ${formatCLP(subtotal)}. Envío por cotizar.`,
          "Por favor, confirmen disponibilidad, costo total y plazo estimado antes del pago.",
        ].join("\n");
        window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
      }}>
        <div className="tp-form-grid">
          <label className="tp-field">
            <span className="tp-label">Región</span>
            <input className="tp-input" value={region} onChange={(event) => setRegion(event.target.value)} required maxLength={80} pattern=".*\\S.*" autoComplete="address-level1" />
          </label>
          <label className="tp-field">
            <span className="tp-label">Comuna</span>
            <input className="tp-input" value={commune} onChange={(event) => setCommune(event.target.value)} required maxLength={80} pattern=".*\\S.*" autoComplete="address-level2" />
          </label>
        </div>
        <label className="tp-field">
          <span className="tp-label">Entrega preferida</span>
          <select className="tp-input" value={destination} onChange={(event) => setDestination(event.target.value)}>
            <option value="domicilio">A domicilio</option>
            <option value="sucursal">Retiro en sucursal</option>
          </select>
        </label>
        <button type="submit" className="tp-btn tp-btn-secondary">Cotizar envío por WhatsApp</button>
        <p className="tp-hint" style={{ margin: 0 }}>
          Se abrirá WhatsApp con tu consulta para que la revises y envíes. La cotización no
          cobra ni reserva productos. Mantendremos tu carrito.
        </p>
      </form>
    </section>
  );
}
