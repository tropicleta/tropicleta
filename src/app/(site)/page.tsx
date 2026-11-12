import type { Metadata } from "next";
import { Suspense } from "react";
import { siteUrl } from "@/lib/site-url";
import Link from "next/link";
import Image from "next/image";
import { ServiceCarousel } from "@/components/ServiceCarousel";
import { ShopSections } from "@/components/shop/ShopSections";
import { site } from "@/data/site";
import { WorkshopGallery } from "@/components/WorkshopGallery";
import { WorkshopIntro } from "@/components/home/WorkshopIntro";
import { HeroVideo } from "@/components/home/HeroVideo";
import { AnimatedEmblem } from "@/components/AnimatedEmblem";
import { getRecommendations } from "@/lib/queries";

export const metadata: Metadata = {
 title: { absolute: "Taller de bicicletas en Tierra Amarilla y Copiapó | Tropicleta" },
 description: "Taller en Carlos Condell 105, Tierra Amarilla. Mantención y reparación de bicicletas, retiro y entrega en Copiapó y Paipote. Cotiza online.",
 alternates: { canonical: siteUrl("/") },
};

export const dynamic = "force-dynamic";

async function HomeShopSections() {
  // This preview is optional: a database outage must not take down the workshop's home page.
  const recommended = await getRecommendations().then(rows => rows.find(r => r.imageUrl)).catch(() => undefined);
  return <ShopSections showcase recommendationPreview={recommended?.imageUrl ? { image: recommended.imageUrl, name: recommended.name } : undefined} />;
}

export default function HomePage() {
  return (
    <div className="tp-home">
      {/* ================= HERO ================= */}
      <section className="tp-hero tp-home-photo-hero tp-home-video-hero" aria-labelledby="tp-main-title">
        <HeroVideo />
        <div className="tp-shell">
          <div className="tp-hero-grid">
            <div>
              <div className="tp-hero-intro-brand"><AnimatedEmblem /><div className="tp-location">
                <span className="tp-location-dot" />
                {site.location}
              </div></div>

              <h1 id="tp-main-title" className="tp-display">
                Taller de bicicletas <span>en Tierra Amarilla.</span>
              </h1>

              <p className="tp-hero-copy">
                Mantención y reparación de bicicletas: frenos, transmisión, suspensión y ruedas.
                Atendemos en Carlos Condell 105, con retiro y entrega en Copiapó y Paipote, previa coordinación.
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

      <WorkshopIntro />

      <section className="tp-section tp-mobile-summary tp-home-hub" aria-label="Taller móvil, tienda y recomendados">
        <div className="tp-shell tp-home-hub-grid">
        <div className="tp-mobile-summary-grid">
          <div className="tp-home-discover">
            <div><span className="tp-kicker">Taller móvil</span><h2 className="tp-display tp-section-title">Nos vemos en tu próxima ruta.</h2><p className="tp-section-intro">Asistencia mecánica para carreras, cicletadas y eventos en Atacama. Coordinamos el apoyo para tu próxima salida.</p><Link className="tp-btn tp-btn-secondary" href="/eventos/">Conocer el taller móvil →</Link></div>
          </div>
          <Link href="/eventos/" className="tp-mobile-summary-photo"><Image src="/taller/taller-movil-presentacion.jpeg" alt="Taller móvil Tropicleta: asistencia mecánica en terreno para eventos ciclistas" width={720} height={1056} sizes="(max-width: 700px) 240px, (max-width: 1000px) 240px, 260px" /></Link>
        </div>
        <div className="tp-home-hub-shops">
          <Suspense fallback={<ShopSections showcase />}><HomeShopSections /></Suspense>
        </div>
        </div>
      </section>

    </div>
  );
}
