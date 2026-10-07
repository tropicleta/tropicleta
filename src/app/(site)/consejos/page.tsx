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
          <Link href="/calculador-sag/" className="tp-post-card">
            <span className="tp-meta">Herramienta interactiva · Suspensión</span>
            <h2 className="tp-display">Calculador de SAG</h2>
            <p>Calcula el hundimiento objetivo de horquilla y amortiguador, compara tu medición y aprende a medirlo.</p>
            <span className="tp-service-link">Calcular SAG →</span>
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
