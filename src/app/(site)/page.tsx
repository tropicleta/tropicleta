import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import Link from "next/link";
import Image from "next/image";
import { ServiceCarousel } from "@/components/ServiceCarousel";
import { ShopSections } from "@/components/shop/ShopSections";
import { site } from "@/data/site";
import { WorkshopGallery } from "@/components/WorkshopGallery";
import { AnimatedEmblem } from "@/components/AnimatedEmblem";

export const metadata: Metadata = {
 title: { absolute: "Taller de bicicletas en Tierra Amarilla y Copiapó | Tropicleta" },
 description: "Taller en Carlos Condell 105, Tierra Amarilla. Mantención y reparación de bicicletas, retiro y entrega en Copiapó y Paipote. Cotiza online.",
 alternates: { canonical: siteUrl("/") },
};

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="tp-home">
      {/* ================= HERO ================= */}
      <section className="tp-hero tp-home-photo-hero" aria-labelledby="tp-main-title">
        <Image className="tp-hero-background" src="/taller/equipo-tropicleta.jpeg" alt="El equipo Tropicleta junto a su furgón en Atacama" fill sizes="100vw" preload />
        <div className="tp-shell">
          <div className="tp-hero-grid">
            <div>
              <div className="tp-hero-intro-brand"><AnimatedEmblem /><div className="tp-location">
                <span className="tp-location-dot" />
                {site.location}
              </div></div>

              <h1 id="tp-main-title" className="tp-display">
                Tu próxima ruta <span>empieza en el taller.</span>
              </h1>

              <p className="tp-hero-copy">
                Mantención, frenos, transmisión, suspensión y ruedas en Tierra Amarilla.
                Cotiza los trabajos que necesitas y coordina tu atención.
              </p>

              <div className="tp-actions">

                <Link className="tp-btn tp-btn-primary" href="/servicios/">
                  Cotizar servicios
                </Link>
              </div>
            </div>

            <div className="tp-hero-showcase"><ServiceCarousel /></div>
          </div>
        </div>
      </section>

      <WorkshopGallery />

      <section className="tp-section tp-mobile-summary">
        <div className="tp-shell tp-mobile-summary-grid">
          <div className="tp-home-discover">
            <div><span className="tp-kicker">Taller móvil</span><h2 className="tp-display tp-section-title">Nos vemos en tu próxima ruta.</h2><p className="tp-section-intro">Asistencia mecánica para carreras, cicletadas y eventos en Atacama. Coordinamos el apoyo para tu próxima salida.</p><Link className="tp-btn tp-btn-secondary" href="/eventos/">Conocer el taller móvil →</Link></div>
          </div>
          <Link href="/eventos/" className="tp-mobile-summary-photo"><Image src="/taller/taller-movil-presentacion.jpeg" alt="Taller móvil Tropicleta: asistencia mecánica en terreno para eventos ciclistas" width={720} height={1056} sizes="(max-width: 700px) 80vw, 300px" /></Link>
        </div>
      </section>

      <section className="tp-section tp-home-marketplace" aria-label="Tienda y recomendados de Tropicleta">
        <div className="tp-shell">
          <ShopSections showcase />
        </div>
      </section>

      {/* ================= CONVERSIÓN LOCAL ================= */}
      <section className="tp-section">
        <div className="tp-shell">
          <div className="tp-local-box">
            <h2 className="tp-display tp-section-title">Encuéntranos en Tierra Amarilla</h2>
            <p className="tp-section-intro">
              Carlos Condell 105 · Atención con coordinación previa.
            </p>
            <div className="tp-actions">

              <Link className="tp-btn tp-btn-secondary" href="/contacto/">
                Ver ubicación y contacto
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
