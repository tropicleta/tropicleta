import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Extras: guías y juego de Tropi",
  description: "Guías para cuidar y ajustar tu bicicleta y el juego de Tropi por el desierto, la costa y las estrellas de Atacama.",
  alternates: { canonical: siteUrl("/extras/") },
};

const guides = [
  { href: "/consejos/", title: "Cuida tu bicicleta", description: "Guías de mantención, transmisión y revisión antes de salir.", action: "Ver las guías" },
  { href: "/biometria/", title: "Altura de sillín", description: "Una herramienta orientativa para revisar tu posición.", action: "Revisar mi sillín" },
  { href: "/calculador-sag/", title: "Ajusta tu suspensión", description: "Aprende a medir el SAG y a afinar el rebote paso a paso.", action: "Abrir la guía de SAG" },
];

export default function ExtrasPage() {
  return <>
    <PageHero kicker="Extras" title="Aprende y" highlight="sal a jugar." intro="Guías para conocer mejor tu bici y una aventura con Tropi por Atacama." />
    <section className="tp-section" aria-labelledby="juego-title"><div className="tp-shell">
      <div className="tp-panel">
        <span className="tp-kicker">El juego de Tropicleta</span>
        <h2 id="juego-title" className="tp-display tp-section-title">Tropi: desierto, costa y estrellas</h2>
        <p className="tp-section-intro">Pedalea por tres niveles y quince etapas: salta, cambia de pista y cuida la flora y fauna del camino. Juega con el teclado o los controles táctiles.</p>
        <a className="tp-btn tp-btn-primary" href="/juegos/tropi/index.html">Jugar con Tropi →</a>
      </div>
    </div></section>
    <section id="guias" className="tp-section tp-about-guides" aria-labelledby="guias-title"><div className="tp-shell">
      <h2 id="guias-title" className="tp-display tp-section-title">Guías del taller</h2>
      <p className="tp-section-intro">Herramientas y consejos para conocer mejor tu bici y cuidarla entre visitas.</p>
      <div className="tp-post-grid">{guides.map(guide => <Link key={guide.href} className="tp-panel" href={guide.href}><h3>{guide.title}</h3><p className="tp-hint">{guide.description}</p><span className="tp-service-link">{guide.action} →</span></Link>)}</div>
    </div></section>
  </>;
}
