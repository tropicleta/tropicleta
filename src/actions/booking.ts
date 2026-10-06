"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { adminEmail, emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { formToObject, zodErrors, type FormState } from "@/lib/forms";
import { displayPhone, formatDate, shortCode } from "@/lib/format";
import { serviceQuote, transportLabels } from "@/lib/service-quote";
import { formatCLP } from "@/lib/format";
import { bookingSchema } from "@/lib/validation";
import { multiVehicleQuote,vehicleQuotesSchema } from "@/lib/multi-quote";
import { shortServiceName } from "@/lib/service-visuals";
import { selectionSchema } from "@/lib/quote-selection";

export async function createBooking(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const d = parsed.data;

  let code:string;
  try{
    const catalog=(await db.select().from(schema.services)).map(s=>({...s,name:shortServiceName(s)}));
    const vehicles=await db.select().from(schema.quoteVehicles).where(eq(schema.quoteVehicles.removed,false));
    let groups:ReturnType<typeof multiVehicleQuote>;
    try{
      if(d.doubleSuspension)throw Error("Elige uno de los vehículos disponibles.");
      const legacy=selectionSchema.parse(d.selection?JSON.parse(d.selection):{manual:d.services.filter(slug=>catalog.find(s=>s.slug===slug)?.kind!=="package"),packages:d.services.filter(slug=>catalog.find(s=>s.slug===slug)?.kind==="package"),excluded:[]});
      const requests=d.vehicleQuotes?vehicleQuotesSchema.parse(JSON.parse(d.vehicleQuotes)):[{id:"vehicle-1",vehicle:d.vehicleType,details:d.vehicleDetails??"",selection:legacy}];
      groups=multiVehicleQuote(catalog,requests,vehicles);
      if(groups.some(g=>!g.calculation.leaves.length))throw Error("Selecciona servicios para cada vehículo o quita los que no quieras cotizar.");
      const leaves=[...new Set(groups.flatMap(g=>g.calculation.leaves))];
      if(leaves.slice().sort().join("|")!==[...new Set(d.services)].sort().join("|"))throw Error("La selección cambió. Revisa tu cotización antes de enviarla.");
    }catch(e){return {errors:{services:e instanceof Error?e.message:"La selección no es válida."},values};}
    const found=groups.flatMap(g=>g.calculation.lines);
    const serviceNames=groups.flatMap(g=>g.calculation.lines.map(s=>g.label+" · "+s.name+" ×"+s.quantity));
    const quote = serviceQuote(found, d.pickup, d.pickupCommune, d.transportMode, d.firstService);
    const quoteText=groups.map(g=>g.label+": "+g.calculation.lines.map(s=>s.name+" ×"+s.quantity+": "+(s.price===null?"A cotizar":(s.priceFrom?"Desde ":"")+formatCLP(s.price*s.quantity))).join("; ")).join("\n")+"; Subtotal de servicios: "+formatCLP(quote.subtotal)+(d.firstService?"; Primer servicio, descuento 10% en servicios: -"+formatCLP(quote.discount):"")+(d.pickup?"; "+transportLabels[d.transportMode]+": "+(quote.transport===null?"A cotizar":formatCLP(quote.transport)):"")+"; Total estimado: "+formatCLP(quote.total)+(quote.pending?"; Valores pendientes de cotizar.":"")+"; Sujeto a diagnóstico y confirmación.";
    const packageDetail=groups.map(g=>g.label+(g.details?" · "+g.details:"")+": "+g.calculation.lines.map(s=>s.name+" ×"+s.quantity+(s.automatic?" (paquete reconocido)":"")+(s.included.length?" · Incluidos: "+s.included.map(slug=>catalog.find(s=>s.slug===slug)!.name+" ×"+s.includedQuantities[slug]).join(", "):"")).join("; ")).join("\n");
    code = shortCode("TP");
    await db.insert(schema.bookings).values({
      code,
      name: d.name,
      phone: d.phone,
      email: d.email ?? null,
      vehicleType: groups[0].vehicle,
      vehicleDetails: groups.map(g=>g.label+(g.details?" · "+g.details:"")).join("; "),
      serviceNames,
      preferredDate: d.preferredDate,
      timeSlot: d.timeSlot,
      pickup: d.pickup,
      pickupCommune: d.pickup ? d.pickupCommune! : null,
      pickupAddress: d.pickup ? d.pickupAddress! : null,
      quoteSnapshot: { version:2, vehicles:groups, lines:found, ...quote },
      notes: [packageDetail, quoteText, d.notes].filter(Boolean).join("\n"),
    });

    const slot = d.timeSlot === "manana" ? "mañana" : "tarde";
    const summary = `
      <p>Código <b>${code}</b></p>
      <p><b>${escapeHtml(d.name)}</b> · ${displayPhone(d.phone)} ${d.email ? "· " + escapeHtml(d.email) : ""}</p>
      <p>${groups.length} ${groups.length===1?"vehículo":"vehículos"}</p>
      <p>Servicios: ${serviceNames.map(escapeHtml).join(", ")}</p>
      <p>${escapeHtml(packageDetail)}</p><p>${escapeHtml(quoteText)}</p>
      <p>Fecha preferida: ${formatDate(d.preferredDate)}, en la ${slot}</p>
      ${d.pickup ? `<p>${transportLabels[d.transportMode]} en ${escapeHtml(d.pickupCommune!)}: ${escapeHtml(d.pickupAddress!)}</p>` : ""}
      ${d.notes ? `<p>Notas: ${escapeHtml(d.notes)}</p>` : ""}`;

    await Promise.all([
      sendEmail(adminEmail(), `Nueva cotización y solicitud de hora ${code}`, emailLayout("Nueva solicitud de hora", summary)),
      sendEmail(
        d.email,
        `Recibimos tu solicitud ${code}`,
        emailLayout(
          "Recibimos tu solicitud",
          `<p>¡Gracias, ${escapeHtml(d.name.split(" ")[0])}! Te contactaremos por WhatsApp para confirmar el día y la hora.</p>${summary}`,
        ),
      ),
    ]);
  } catch (e) {
    console.error("[agendar]", e);
    return { message: "No pudimos registrar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.", values };
  }

  redirect(`/agendar/gracias/?codigo=${code}`);
}
