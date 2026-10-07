import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/nosotros/") },
  title: "Nosotros",
  description: "Tropicleta es un taller de bicicletas y scooters eléctricos en Tierra Amarilla, Región de Atacama.",
};

// Contenido DUMMY: reemplazar con la historia real de Tropicleta.
const values = [
  { n: "01", t: "Diagnóstico honesto", d: "Revisamos gratis y te explicamos qué necesita tu bici y qué puede esperar. Sin sorpresas en la cuenta." },
  { n: "02", t: "Trabajo bien hecho", d: "Torque correcto, repuestos compatibles y prueba de rodado antes de entregar. Por eso damos 2 semanas de garantía." },
  { n: "03", t: "Cerca tuyo", d: "Coordinamos por WhatsApp y retiramos en Tierra Amarilla, Paipote y Copiapó para que no pierdas tiempo." },
];

export default function NosotrosPage() {
  return (
    <>
      <PageHero
        kicker="Nosotros"
        title="Un taller hecho"
        highlight="para rodar."
        intro="Tropicleta nació en Tierra Amarilla con una idea simple: que pedalear en Atacama sea más fácil, con un taller cercano, ordenado y que responde."
      />

      <section className="tp-section">
        <div className="tp-shell tp-two-col">
          <div className="tp-prose">
            <h2>Nuestra historia</h2>
            <p>
              Empezamos arreglando las bicis de amigos y vecinos en un garaje. El polvo, las espinas y los cerros del
              norte exigen más a cada componente, y nos dimos cuenta de que hacía falta un taller que entendiera eso.
            </p>
            <p>
              Hoy atendemos con coordinación previa para dedicarle el tiempo que cada bici necesita: desde un ajuste de
              cambios hasta servicios de suspensión, tubeless y scooters eléctricos.
            </p>
            <h2>Taller móvil</h2>
            <p>
              También llevamos el taller a cicletadas, carreras y eventos ciclistas de la Región de Atacama, para que
              nadie se quede abajo por un pinchazo o un cambio desregulado.
            </p>
          </div>
          <aside className="tp-local-box">
            <span className="tp-kicker">En números</span>
            <div className="tp-stats" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 0 }}>
              <div className="tp-stat">
                <strong>8</strong>
                <span>Categorías de servicio</span>
              </div>
              <div className="tp-stat">
                <strong>2</strong>
                <span>Semanas de garantía</span>
              </div>
              <div className="tp-stat">
                <strong>3</strong>
                <span>Comunas con retiro</span>
              </div>
              <div className="tp-stat">
                <strong>$0</strong>
                <span>Diagnóstico</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="tp-section tp-shop">
        <div className="tp-shell">
          <span className="tp-kicker">Cómo trabajamos</span>
          <h2 className="tp-display tp-section-title">Lo que nos importa</h2>
          <div className="tp-feature-grid tp-feature-grid-3" style={{ marginTop: 26 }}>
            {values.map((v) => (
              <div key={v.n} className="tp-feature">
                <div className="tp-feature-num">{v.n}</div>
                <h3 className="tp-display">{v.t}</h3>
                <p>{v.d}</p>
              </div>
            ))}
          </div>
          <div className="tp-actions" style={{ marginTop: 30 }}>
            <Link className="tp-btn tp-btn-primary" href="/agendar/">
              Solicitar hora
            </Link>

          </div>
        </div>
      </section>
    </>
  );
}
