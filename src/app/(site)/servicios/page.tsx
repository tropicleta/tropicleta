import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { BookingForm } from "@/components/forms/BookingForm";
import { db,schema } from "@/db";
import { asc,eq } from "drizzle-orm";
import { getServiceCatalog } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: siteUrl("/servicios/") }, title: "Taller de bicicletas y cotización en Tierra Amarilla", description: "Cotiza mantención, frenos, suspensión y ruedas en Tropicleta, Tierra Amarilla. Servicios para bicicletas y scooters, con retiro en Copiapó y Paipote." };
export default async function ServiciosPage({ searchParams }: { searchParams: Promise<{ servicio?: string;vehiculo?:string;categoria?:string }> }) {
  const { servicio,vehiculo,categoria } = await searchParams;
  const catalog = (await getServiceCatalog()).map(c => ({ slug: c.slug, name: c.name, services: c.services.map(s => ({slug: s.slug, name: s.name, summary: s.summary, price: s.price, priceFrom: s.priceFrom, requiresDoubleSuspension:s.requiresDoubleSuspension, excludesDoubleSuspension:s.excludesDoubleSuspension, removed:s.removed, kind: s.kind, components: s.components, vehicles: s.vehicles, individuallySelectable: s.individuallySelectable, active: s.active})) }));
  const vehicles=await db.select().from(schema.quoteVehicles).where(eq(schema.quoteVehicles.removed,false)).orderBy(asc(schema.quoteVehicles.sort),asc(schema.quoteVehicles.id));
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
  return <><section className="tp-hero tp-page-hero tp-services-hero"><div className="tp-shell" style={{position:"relative",zIndex:1}}><span className="tp-kicker">Taller Tropicleta</span><h1 className="tp-display">Taller.</h1><p className="tp-hero-copy">Elige lo que necesita tu bici o scooter, revisa cómo se suma cada servicio y envía tu cotización. Atendemos en Carlos Condell 105, Tierra Amarilla, con retiro y entrega en Copiapó y Paipote. Si quieres, solicita tu hora en el mismo lugar.</p></div></section><section className="tp-section tp-services-section"><div className="tp-shell">
    <BookingForm key={[servicio,vehiculo,categoria].filter(Boolean).join("|") || "cotizacion"} vehicles={vehicles} catalog={catalog} preselected={servicio} initialVehicleSlug={vehiculo} initialCategory={catalog.some(c=>c.slug===categoria)?categoria:undefined} minDate={tomorrow} /></div></section>
    <section className="tp-section" aria-labelledby="detalle-servicios"><div className="tp-shell">
      <h2 id="detalle-servicios" className="tp-display tp-category-heading">Servicios de taller: qué incluye cada trabajo</h2>
      <p className="tp-section-intro">Consulta el detalle antes de cotizar tu mantención o reparación. Atendemos en Tierra Amarilla, con retiro y entrega en Copiapó y Paipote, previa coordinación.</p>
      <div className="tp-post-grid">{catalog.map(category => <div key={category.slug} className="tp-panel">
        <h3 className="tp-display tp-category-heading">{category.name}</h3>
        <ul>{category.services.filter(service => !service.removed).map(service => <li key={service.slug}><Link href={`/servicios/${service.slug}/`}>{service.name}</Link></li>)}</ul>
      </div>)}</div>
    </div></section></>;
}
