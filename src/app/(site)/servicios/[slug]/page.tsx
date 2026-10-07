import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService } from "@/lib/queries";
import { formatCLP } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getService(slug);
  if (!data) return { title: "Servicio no encontrado" };
  return {
    alternates: { canonical: siteUrl(`/servicios/${data.service.slug}/`) },
    title: data.service.name,
    description: data.service.summary ?? `${data.service.name} en Tropicleta, Tierra Amarilla.`,
  };
}

export default async function ServicioPage({ params }: Props) {
  const { slug } = await params;
  const data = await getService(slug);
  if (!data) notFound();
  const { service: s, category: c } = data;

  const includes = s.includes.length
    ? s.includes
    : ["Diagnóstico gratuito antes de empezar", "Garantía de 2 semanas", "Atención con coordinación previa"];

  return (
    <section className="tp-hero tp-page-hero">
      <div className="tp-shell" style={{ position: "relative", zIndex: 1 }}>
        <nav className="tp-breadcrumb" aria-label="Ruta">
          <Link href="/servicios/">Servicios</Link>
          <span>/</span>
          <Link href={`/servicios/#${c.slug}`}>{c.name}</Link>
        </nav>

        <div className="tp-two-col">
          <div>
            <span className="tp-kicker">{c.name}</span>
            <h1 className="tp-display">{s.name}</h1>
            {s.summary && <p className="tp-hero-copy">{s.summary}</p>}
            {s.description && (
              <div className="tp-muted" style={{ whiteSpace: "pre-line", marginBottom: 24, maxWidth: 650 }}>
                {s.description}
              </div>
            )}
            <ul className="tp-check-list">
              {includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="tp-panel tp-panel-accent">
            <div className="tp-trust-label">Precio</div>
            <div className="tp-price" style={{ fontSize: 48, margin: "6px 0 10px" }}>
              {s.price ? `${s.priceFrom ? "Desde " : ""}${formatCLP(s.price)}` : "A cotizar"}
            </div>
            {s.duration && <p className="tp-muted tp-small">Tiempo estimado: {s.duration}</p>}
            <p className="tp-muted tp-small">
              Confirma alcance y disponibilidad al coordinar. Los repuestos o trabajos adicionales no indicados en la ficha se cotizan aparte.
            </p>
            <div className="tp-stack" style={{ marginTop: 18 }}>
              <Link className="tp-btn tp-btn-primary tp-btn-block" href={`/servicios/?servicio=${s.slug}`}>
                Agregar a mi cotización
              </Link>

            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
