import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { MobileWorkshopGallery } from "@/components/MobileWorkshopGallery";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/eventos/") },
  title: "Taller móvil para eventos",
  description: "Llevamos el taller Tropicleta a cicletadas, carreras y eventos ciclistas en la Región de Atacama. Cotiza tu evento.",
};

const features = [
  { n: "01", t: "Mecánica en terreno", d: "Llevamos el apoyo del taller a tu encuentro ciclista. Acordamos los servicios y recursos según las necesidades del evento." },
  { n: "02", t: "Rutas y eventos", d: "Apoyo para actividades ciclistas en la Región de Atacama, cerca de quienes salen a pedalear." },
  { n: "03", t: "Coordinación previa", d: "Cuéntanos la fecha, ubicación, duración y cantidad aproximada de participantes para preparar una cotización." },
  { n: "04", t: "Comunidad en movimiento", d: "Desde encuentros locales hasta experiencias como Little MTB, acompañamos las historias que nacen sobre dos ruedas." },
];

export default function EventosPage() {
  return (
    <div className="tp-events-page">
      <div className="tp-events-intro">
      <PageHero
        kicker="Taller móvil"
        title="Llevamos el taller"
        highlight="a tu evento."
        intro="Tu bici, nuestro apoyo donde nos necesites. Asistencia mecánica en terreno y apoyo en rutas y eventos ciclistas de Atacama, con coordinación previa."
      >

        <a className="tp-btn tp-btn-secondary" href="#cotizar">
          Formulario de cotización
        </a>
      </PageHero>
      <MobileWorkshopGallery />
      </div>

      <section className="tp-section">
        <div className="tp-shell">
          <div className="tp-feature-grid">
            {features.map((f) => (
              <div key={f.n} className="tp-feature">
                <h3 className="tp-display">{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
          <a className="tp-catalog-poster-link" href="/catalogo/7.jpg" target="_blank" rel="noopener">Ver la presentación del taller móvil ↗</a>
        </div>
      </section>

      <section className="tp-section tp-shop" id="cotizar">
        <div className="tp-shell tp-two-col">
          <div className="tp-panel">
            <span className="tp-kicker">Cotización</span>
            <h2 className="tp-display tp-category-heading">Cuéntanos de tu evento</h2>
            <ContactForm subject="eventos" />
          </div>
          <aside className="tp-local-box">
            <span className="tp-kicker">Para preparar tu cotización</span>
            <ul className="tp-local-list" style={{ marginBottom: 0 }}>
              <li className="tp-local-item">Fecha y horario de la actividad.</li>
              <li className="tp-local-item">Lugar de encuentro y recorrido.</li>
              <li className="tp-local-item">Cantidad aproximada de ciclistas.</li>
              <li className="tp-local-item">Tipo de evento y apoyo que necesitas.</li>
            </ul>
          </aside>
        </div>
      </section>
    </div>
  );
}
