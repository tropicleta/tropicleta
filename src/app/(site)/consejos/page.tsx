import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { posts } from "@/data/posts";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/consejos/") },
  title: "Consejos",
  description: "Consejos de mantención y uso de bicicletas desde el taller Tropicleta en Atacama.",
};

const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

export default function ConsejosPage() {
  return (
    <>
      <PageHero kicker="Consejos" title="Desde el" highlight="taller." intro="Guías cortas para cuidar tu bici entre visitas al taller." />
      <section className="tp-section">
        <div className="tp-shell tp-post-grid">
          <Link href="/prepara-tu-carrera/" className="tp-post-card">
            <span className="tp-meta">Guía práctica · Competición</span>
            <h2 className="tp-display">Prepara tu próxima carrera</h2>
            <p>Revisa tu bici, anota qué necesitas y coordina los servicios con la fecha de tu carrera a la vista.</p>
            <span className="tp-service-link">Preparar mi revisión →</span>
          </Link>
          <Link href="/biometria/" className="tp-post-card">
            <span className="tp-meta">Herramienta orientativa · Postura</span>
            <h2 className="tp-display">Observa tu posición</h2>
            <p>Elige el módulo de tu disciplina y observa tus ángulos con cámara o foto, sin subir imágenes.</p>
            <span className="tp-service-link">Explorar bike fitting →</span>
          </Link>
          <Link href="/calculador-sag/" className="tp-post-card">
            <span className="tp-meta">Herramienta interactiva · Suspensión</span>
            <h2 className="tp-display">Ajusta tu suspensión</h2>
            <p>Prepara tu bici, mide el SAG y afina el rebote. Una guía práctica, paso a paso.</p>
            <span className="tp-service-link">Ajustar mi suspensión →</span>
          </Link>
          {posts.map((p) => (
            <Link key={p.slug} href={`/consejos/${p.slug}/`} className="tp-post-card">
              <span className="tp-meta">
                {fmt(p.date)} · {p.readingMinutes} min
              </span>
              <h2 className="tp-display">{p.title}</h2>
              <p>{p.excerpt}</p>
              <span className="tp-service-link" style={{ marginTop: 6 }}>
                Leer →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
