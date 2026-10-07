import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { site } from "@/data/site";
import { WA_CONSULTAR } from "@/lib/whatsapp";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/contacto/") },
  title: "Ubicación del taller en Tierra Amarilla y contacto",
  description: "Contacta a Tropicleta, taller de bicicletas en Tierra Amarilla. WhatsApp, cobertura de retiro y entrega y formulario de contacto.",
};

const hours = site.hours;

export default function ContactoPage() {
  return (
    <>
      <section className="tp-hero tp-page-hero">
        <div className="tp-shell" style={{ position: "relative", zIndex: 1 }}>
          <span className="tp-kicker">Contacto</span>
          <h1 className="tp-display">
            Hablemos de <span>tu bici.</span>
          </h1>
          <p className="tp-hero-copy">
            Atendemos con coordinación previa desde Tierra Amarilla y contamos con retiro y entrega en sectores definidos
            de Tierra Amarilla, Paipote y Copiapó.
          </p>
          <div className="tp-actions">
            <a className="tp-btn tp-btn-primary" href={WA_CONSULTAR} target="_blank" rel="noopener">
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="tp-section">
        <div className="tp-shell tp-two-col">
          <div className="tp-panel">
            <span className="tp-kicker">Formulario</span>
            <h2 className="tp-display tp-category-heading">Déjanos un mensaje</h2>
            <ContactForm />
          </div>

          <div className="tp-stack">
            <div className="tp-panel">
              <div className="tp-trust-label">WhatsApp</div>
              <a className="tp-trust-value" href={WA_CONSULTAR} target="_blank" rel="noopener">
                {site.whatsappDisplay}
              </a>
              {site.email && (
                <>
                  <div className="tp-trust-label" style={{ marginTop: 16 }}>
                    Email
                  </div>
                  <a className="tp-trust-value" href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                </>
              )}
              <div className="tp-trust-label" style={{ marginTop: 16 }}>
                Ubicación
              </div>
              <div className="tp-trust-value">{site.addressNote}</div>
            </div>

            <div className="tp-panel">
              <div className="tp-trust-label" style={{ marginBottom: 10 }}>
                Horario
              </div>
              <dl className="tp-dl">
                {hours.map((h) => (
                  <div key={h.days}>
                    <dt>{h.days}</dt>
                    <dd>{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="tp-panel tp-panel-accent">
              <div className="tp-trust-label" style={{ marginBottom: 10 }}>
                Retiro y entrega
              </div>
              <ul className="tp-check-list">
                {site.coverage.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            <iframe
              title="Mapa del taller: Carlos Condell 105, Tierra Amarilla"
              src={`https://www.google.com/maps?q=${encodeURIComponent(site.address + ", Atacama, Chile")}&output=embed`}
              loading="lazy"
              style={{ width: "100%", height: 260, border: 0, borderRadius: "var(--tp-radius)", filter: "grayscale(1) invert(.9) contrast(.9)" }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
