import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import Link from "next/link";
import Image from "next/image";
import { ServiceCarousel } from "@/components/ServiceCarousel";
import { getFeaturedProducts } from "@/lib/queries";
import { ShopSections } from "@/components/shop/ShopSections";
import { ProductCard } from "@/components/shop/ProductCard";
import { site } from "@/data/site";
import { WorkshopGallery } from "@/components/WorkshopGallery";
import { AnimatedEmblem } from "@/components/AnimatedEmblem";

export const metadata: Metadata = {
 title: { absolute: "Taller de bicicletas en Tierra Amarilla y Copiapó | Tropicleta" },
 description: "Taller en Carlos Condell 105, Tierra Amarilla. Mantención y reparación de bicicletas, retiro y entrega en Copiapó y Paipote. Cotiza online.",
 alternates: { canonical: siteUrl("/") },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(4);

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
                Taller de bicicletas <span>hecho para rodar.</span>
              </h1>

              <p className="tp-hero-copy">
                Servicio técnico de bicicletas con atención coordinada en Tierra Amarilla, cerca de Paipote y
                Copiapó. Mantenciones, ajustes y servicios especializados.
              </p>

              <div className="tp-actions">

                <Link className="tp-btn tp-btn-secondary" href="/servicios/">
                  Cotizar servicios
                </Link>
                <Link className="tp-btn tp-btn-secondary" href="/tienda/">
                  Tienda
                </Link>
              </div>
            </div>

            <div className="tp-hero-showcase"><ServiceCarousel /></div>
          </div>
        </div>
      </section>

      <section className="tp-section tp-mobile-summary">
        <div className="tp-shell tp-mobile-summary-grid">
          <div className="tp-home-discover">
            <div><span className="tp-kicker">Taller móvil</span><h2 className="tp-display tp-section-title">Nos vemos en tu próxima ruta.</h2><p className="tp-section-intro">Asistencia mecánica para carreras, cicletadas y eventos en Atacama. Coordinamos el apoyo para tu próxima salida.</p><Link className="tp-btn tp-btn-secondary" href="/eventos/">Conocer el taller móvil →</Link></div>
          </div>
          <Link href="/eventos/" className="tp-mobile-summary-photo"><Image src="/taller/taller-movil-presentacion.jpeg" alt="Taller móvil Tropicleta: asistencia mecánica en terreno para eventos ciclistas" width={720} height={1056} sizes="(max-width: 700px) 80vw, 300px" /></Link>
        </div>
      </section>

      <section className="tp-section tp-home-marketplace" aria-labelledby="home-marketplace-title">
        <div className="tp-shell">
          <span className="tp-kicker">Para seguir pedaleando</span>
          <h2 id="home-marketplace-title" className="tp-display tp-section-title">Equipa tu próxima salida.</h2>
          <ShopSections showcase />
        </div>
      </section>

      {/* ================= TIENDA ================= */}
      {featuredProducts.length > 0 && <section className="tp-section tp-shop">
        <div className="tp-shell">
          <div className="tp-shop-layout">
            <div>
              <span className="tp-kicker">Tienda Tropicleta</span>
              <h2 className="tp-display tp-section-title">Productos seleccionados</h2>
              <p className="tp-section-intro">
                Una selección pequeña de productos para ciclistas, elegidos para complementar el trabajo del taller.
              </p>
              <div className="tp-actions">
                <Link className="tp-btn tp-btn-primary" href="/tienda/">
                  Ver tienda
                </Link>
              </div>
            </div>

            <div className="tp-shop-panel">
              {featuredProducts.length > 0 ? (
                <div className="tp-mini-products">
                  {featuredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="tp-shop-placeholder">
                    <div>
                      <strong>Encuentra lo que necesita tu bicicleta</strong>
                      <br />
                      <br />
                      Escríbenos para consultar productos y disponibilidad.
                    </div>
                  </div>

                </>
              )}
            </div>
          </div>
        </div>
      </section>}

      {/* ================= CONVERSIÓN LOCAL ================= */}
      <WorkshopGallery />
      <section className="tp-section">
        <div className="tp-shell">
          <div className="tp-local-box">
            <span className="tp-kicker">Taller local</span>
            <h2 className="tp-display tp-section-title">Taller en Tierra Amarilla, cerca de Copiapó</h2>
            <p className="tp-section-intro">
              Visítanos en Carlos Condell 105, Tierra Amarilla, con coordinación previa. Si estás en Copiapó o Paipote, puedes solicitar retiro y entrega al armar tu cotización. El transporte se coordina según disponibilidad.
            </p>
            <ul className="tp-local-list">
              <li className="tp-local-item">Diagnóstico gratuito.</li>
              <li className="tp-local-item">Atención con coordinación previa.</li>
              <li className="tp-local-item">Servicios para bicicletas y scooters eléctricos.</li>
              <li className="tp-local-item">Taller móvil para eventos ciclistas en la Región de Atacama.</li>
            </ul>
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
