import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { BookingForm } from "@/components/forms/BookingForm";
import { db,schema } from "@/db";
import { asc,eq } from "drizzle-orm";
import { getServiceCatalog } from "@/lib/queries";
import { raceBookingNotes } from "@/data/race-preparation";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: siteUrl("/servicios/") }, title: "Mantención de bicicletas y cotización en Tierra Amarilla", description: "Cotiza mantención, frenos, suspensión y ruedas en Tropicleta, Tierra Amarilla. Servicios para bicicletas y scooters, con retiro en Copiapó y Paipote." };
export default async function ServiciosPage({ searchParams }: { searchParams: Promise<{ servicio?: string;vehiculo?:string;motivo?:string;fechaCarrera?:string;revisar?:string }> }) {
  const { servicio,vehiculo,motivo,fechaCarrera,revisar } = await searchParams;
  const initialNotes = motivo === "carrera" ? raceBookingNotes(fechaCarrera, revisar) : undefined;
  const catalog = (await getServiceCatalog()).map(c => ({ slug: c.slug, name: c.name, services: c.services.map(s => ({slug: s.slug, name: s.name, summary: s.summary, price: s.price, priceFrom: s.priceFrom, requiresDoubleSuspension:s.requiresDoubleSuspension, excludesDoubleSuspension:s.excludesDoubleSuspension, removed:s.removed, kind: s.kind, components: s.components, vehicles: s.vehicles, individuallySelectable: s.individuallySelectable, active: s.active})) }));
  const vehicles=await db.select().from(schema.quoteVehicles).where(eq(schema.quoteVehicles.removed,false)).orderBy(asc(schema.quoteVehicles.sort),asc(schema.quoteVehicles.id));
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
  return <><section className="tp-hero tp-page-hero tp-services-hero"><div className="tp-shell" style={{position:"relative",zIndex:1}}><span className="tp-kicker">Taller Tropicleta</span><h1 className="tp-display">Servicios y <span>cotización.</span></h1><p className="tp-hero-copy">Elige lo que necesita tu bici o scooter, revisa cómo se suma cada servicio y envía tu cotización. Atendemos en Carlos Condell 105, Tierra Amarilla, con retiro y entrega en Copiapó y Paipote. Si quieres, solicita tu hora en el mismo lugar.</p></div></section><section className="tp-section tp-services-section"><div className="tp-shell">
    {initialNotes && <p className="tp-alert">Solicitud para carrera: en el último paso encontrarás una nota editable con la fecha y los puntos por consultar. Completa cuándo necesitas la bici. El taller debe confirmar la atención, los repuestos y la entrega.</p>}
    <BookingForm key={[servicio,vehiculo,motivo,fechaCarrera,revisar].filter(Boolean).join("|") || "cotizacion"} vehicles={vehicles} catalog={catalog} preselected={servicio} initialVehicleSlug={vehiculo} minDate={tomorrow} initialNotes={initialNotes} /></div></section></>;
}
