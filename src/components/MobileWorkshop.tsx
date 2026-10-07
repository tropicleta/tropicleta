import Image from "next/image";
import Link from "next/link";

export function MobileWorkshop() {
  return <section className="tp-section tp-mobile" aria-labelledby="mobile-title">
    <div className="tp-shell tp-mobile-grid">
      <a href="/catalogo/7.jpg" target="_blank" rel="noopener" className="tp-mobile-poster" aria-label="Abrir lámina completa del taller móvil">
        <Image src="/catalogo/7.jpg" alt="Catálogo Tropicleta: taller móvil para eventos ciclistas en Atacama" width={720} height={1280} sizes="(max-width: 760px) 85vw, 360px" />
      </a>
      <div>
        <span className="tp-kicker">Taller móvil · Región de Atacama</span>
        <h2 id="mobile-title" className="tp-display tp-section-title">Tu bici, nuestro apoyo.<br />Donde nos necesites.</h2>
        <p className="tp-section-intro">El taller también sale a la ruta. Acompañamos eventos ciclistas con asistencia mecánica en terreno, para estar cerca de las bicicletas y de las personas que las mueven.</p>
        <ul className="tp-local-list">
          <li className="tp-local-item">Asistencia mecánica en terreno.</li>
          <li className="tp-local-item">Apoyo en rutas y eventos.</li>
          <li className="tp-local-item">Disponibilidad y alcance con coordinación previa.</li>
        </ul>
        <div className="tp-actions">

          <Link className="tp-btn tp-btn-secondary" href="/eventos/">Conocer el taller móvil →</Link>
        </div>
      </div>
    </div>
  </section>;
}

export function PickupRates() {
  return <section id="retiro-entrega" className="tp-section tp-pickup-visual" aria-labelledby="pickup-title"><div className="tp-shell tp-pickup-grid">
    <div><span className="tp-kicker">Tu bici también viaja con nosotros</span><h2 id="pickup-title" className="tp-display tp-section-title">Del taller<br />a tu puerta.</h2><p className="tp-section-intro">Nos acercamos a tu bici. Coordinamos el retiro y su regreso en Tierra Amarilla, Paipote y Copiapó para que tú solo pienses en volver a pedalear.</p><p className="tp-muted">Elige tu zona al cotizar y verás el transporte sumado al total. Para solo retiro, solo entrega u otras zonas, escríbenos.</p><div className="tp-actions"><Link className="tp-btn tp-btn-primary" href="/servicios/">Cotizar servicio + transporte →</Link></div></div>
    <div className="tp-pickup-poster"><div className="tp-pickup-crop"><Image src="/catalogo/4.jpg" alt="Tarifas de retiro y entrega: Tierra Amarilla $3.000 un trayecto o $5.000 ambos; Paipote $8.000 o $15.000; Copiapó $12.000 o $20.000" width={720} height={1280} sizes="(max-width: 760px) 100vw, 500px" /></div></div>
  </div></section>;
}
