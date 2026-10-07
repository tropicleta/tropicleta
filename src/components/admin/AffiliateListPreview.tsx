"use client";
import { useState } from "react";

export function AffiliateListPreview() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <section className="tp-panel tp-stack">
    <h2>Conectar tu lista de afiliados</h2>
    <p>Comprueba si el servidor puede leer tu lista pública completa de Mercado Libre. Esta prueba no modifica los recomendados publicados.</p>
    <button type="button" className="tp-btn tp-btn-secondary" disabled={pending} onClick={async () => {
      setPending(true); setMessage("");
      try {
        const response = await fetch("/api/admin/affiliate-list-preview/", { method: "POST" });
        const data = await response.json();
        setMessage(response.ok ? `Lista completa leída: ${data.items.length} productos en ${data.pages} páginas. La conexión funciona; falta activar la sincronización.` : data.message ?? "No pudimos leer la lista.");
      } catch { setMessage("La comprobación se interrumpió. Tus recomendados se conservan."); }
      finally { setPending(false); }
    }}>{pending ? "Comprobando la lista…" : "Comprobar conexión con Mercado Libre"}</button>
    {message && <p className="tp-alert" role="status">{message}</p>}
  </section>;
}
