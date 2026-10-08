import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/nosotros/") },
  title: "Nosotros",
  description: "Tropicleta es un taller de bicicletas y scooters eléctricos en Tierra Amarilla, Región de Atacama.",
};

const values = [
  { n: "01", t: "Diagnóstico honesto", d: "Revisamos gratis y te explicamos qué necesita tu bici y qué puede esperar. Sin sorpresas en la cuenta." },
  { n: "02", t: "Alcance claro", d: "El catálogo detalla los trabajos e inclusiones. Consulta la compatibilidad de tus componentes y coordina los repuestos y la fecha de entrega con el taller." },
  { n: "03", t: "Cerca tuyo", d: "Coordinamos por WhatsApp y retiramos en Tierra Amarilla, Paipote y Copiapó para que no pierdas tiempo." },
];

export default function NosotrosPage() {
  return (
    <>
      <PageHero
        kicker="Nosotros"
        title="Un taller hecho"
        highlight="para rodar."
        intro="Taller de bicicletas y scooters en Tierra Amarilla. Atención coordinada, servicios con inclusiones detalladas y apoyo móvil en eventos ciclistas de Atacama."
      />

      <section className="tp-section">
        <div className="tp-shell tp-two-col">
          <div className="tp-prose">
            <h2>El taller detrás de tu próxima salida</h2>
            <p>
              Atendemos en Carlos Condell 105, Tierra Amarilla. Puedes solicitar retiro y entrega en Tierra Amarilla,
              Paipote y Copiapó, con coordinación previa y según disponibilidad.
            </p>
            <p>
              Hoy atendemos con coordinación previa para dedicarle el tiempo que cada bici necesita: desde un ajuste de
              cambios hasta servicios de suspensión, tubeless y scooters eléctricos.
            </p>
            <h2>Taller móvil</h2>
            <p>
              También llevamos el taller a cicletadas, carreras y eventos ciclistas de la Región de Atacama, para que
              los organizadores puedan coordinar apoyo mecánico en terreno.
            </p>
          </div>
          <aside className="tp-local-box">
            <Image src="/taller/equipo-tropicleta.jpeg" alt="Equipo Tropicleta junto a su taller móvil en Atacama" width={960} height={720} sizes="(max-width: 800px) 100vw, 480px" style={{width:"100%",height:"auto",borderRadius:12,marginBottom:20}} />
            <span className="tp-kicker">Atención local</span>
            <div className="tp-stats" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 0 }}>
              <div className="tp-stat">
                <strong>Taller</strong>
                <span>En Tierra Amarilla</span>
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
            <Link className="tp-btn tp-btn-secondary" href="https://www.instagram.com/tropicleta/" target="_blank" rel="noopener noreferrer">Ver trabajos publicados ↗</Link>

          </div>
        </div>
      </section>
    </>
  );
}
