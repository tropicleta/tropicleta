import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import Link from "next/link";
import Image from "next/image";
import { ServiceCarousel } from "@/components/ServiceCarousel";
import { ShopSections } from "@/components/shop/ShopSections";
import { site } from "@/data/site";
import { WorkshopGallery } from "@/components/WorkshopGallery";
import { AnimatedEmblem } from "@/components/AnimatedEmblem";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";

export const metadata: Metadata = {
 title: { absolute: "Taller de bicicletas en Tierra Amarilla y Copiapó | Tropicleta" },
 description: "Taller en Carlos Condell 105, Tierra Amarilla. Mantención y reparación de bicicletas, retiro y entrega en Copiapó y Paipote. Cotiza online.",
 alternates: { canonical: siteUrl("/") },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recommended] = await db.select({ image: schema.recommendations.imageUrl, name: schema.recommendations.name }).from(schema.recommendations).where(and(eq(schema.recommendations.active, true), isNotNull(schema.recommendations.imageUrl))).orderBy(desc(schema.recommendations.createdAt)).limit(1);
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

      <section className="tp-section" aria-labelledby="taller-local">
        <div className="tp-shell tp-two-col">
          <div>
            <span className="tp-kicker">Servicio técnico en Atacama</span>
            <h2 id="taller-local" className="tp-display tp-category-heading">Mantención y reparación para tu próxima ruta</h2>
            <p className="tp-section-intro">¿Tu bicicleta necesita un ajuste de cambios, revisión de frenos o mantención completa? En Tropicleta revisamos tu bici y te entregamos un presupuesto antes de realizar el trabajo. El diagnóstico es gratuito y la mano de obra tiene 2 semanas de garantía.</p>
            <p>Consulta los servicios disponibles, selecciona lo que necesitas y coordina la atención. Los repuestos y los trabajos adicionales se cotizan aparte.</p>
            <div className="tp-actions"><Link className="tp-btn tp-btn-primary" href="/servicios/">Ver servicios de reparación y cotizar</Link></div>
          </div>
          <div className="tp-panel">
            <h2 className="tp-display tp-category-heading">¿Buscas taller de bicicletas en Copiapó o Paipote?</h2>
            <p>Nuestro taller está en {site.address}, Región de Atacama. Si estás en Copiapó o Paipote, puedes solicitar retiro y entrega de tu bicicleta en sectores definidos. Confirma disponibilidad y costo según tu ubicación antes de coordinar.</p>
            <p>La atención del taller es con coordinación previa. Escríbenos al <a href={`tel:+${site.whatsappNumber}`}>{site.whatsappDisplay}</a> para consultar por tu bicicleta.</p>
            <Link className="tp-btn tp-btn-secondary" href="/contacto/">Cómo llegar al taller y consultar por retiro</Link>
          </div>
        </div>
      </section>

      <section className="tp-section tp-mobile-summary tp-home-hub" aria-label="Taller móvil, tienda y recomendados">
        <div className="tp-shell tp-home-hub-grid">
        <div className="tp-mobile-summary-grid">
          <div className="tp-home-discover">
            <div><span className="tp-kicker">Taller móvil</span><h2 className="tp-display tp-section-title">Nos vemos en tu próxima ruta.</h2><p className="tp-section-intro">Asistencia mecánica para carreras, cicletadas y eventos en Atacama. Coordinamos el apoyo para tu próxima salida.</p><Link className="tp-btn tp-btn-secondary" href="/eventos/">Conocer el taller móvil →</Link></div>
          </div>
          <Link href="/eventos/" className="tp-mobile-summary-photo"><Image src="/taller/taller-movil-presentacion.jpeg" alt="Taller móvil Tropicleta: asistencia mecánica en terreno para eventos ciclistas" width={720} height={1056} sizes="(max-width: 700px) 240px, (max-width: 1000px) 240px, 260px" /></Link>
        </div>
        <div className="tp-home-hub-shops">
          <ShopSections showcase recommendationPreview={recommended?.image ? { image: recommended.image, name: recommended.name } : undefined} />
        </div>
        </div>
      </section>

    </div>
  );
}
