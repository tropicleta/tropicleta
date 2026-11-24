import { z } from "zod";
import { bookingServiceGroups } from "./booking-service-groups";
import { formatCLP, formatDate } from "./format";
import { transportLabels } from "./service-quote";

const snapshotSchema = z.object({
  vehicles: z.array(z.object({
    label: z.string(),
    details: z.string(),
    calculation: z.object({
      lines: z.array(z.object({
        name: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().nullable(),
        priceFrom: z.boolean(),
      })).min(1),
    }),
  })).min(1),
  subtotal: z.number(),
  discount: z.number(),
  transport: z.number().nullable(),
  total: z.number(),
  pending: z.boolean(),
  from: z.boolean(),
  promotion: z.object({ code: z.string(), percent: z.number(), applied: z.boolean() }).nullish(),
  transportMode: z.enum(["pickup", "delivery", "both"]).nullish(),
  customerNotes: z.string().nullish(),
});

type Booking = Parameters<typeof bookingServiceGroups>[0] & {
  code: string;
  name: string;
  preferredDate: string;
  timeSlot: string;
  pickup: boolean;
  pickupCommune: string | null;
  pickupAddress: string | null;
  notes: string | null;
};

type SummaryRow = { label: string; value: string };

export function bookingConfirmation(booking: Booking) {
  const result = snapshotSchema.safeParse(booking.quoteSnapshot);
  const quote = result.success ? result.data : null;
  const groups = quote ? quote.vehicles.map(({ label, details, calculation }) => ({
    label,
    details,
    services: calculation.lines.map((line) => ({
      label: `${line.name} ×${line.quantity}`,
      value: line.price === null ? "A cotizar" : `${line.priceFrom ? "Desde " : ""}${formatCLP(line.price * line.quantity)}`,
    })),
  })) : bookingServiceGroups(booking).map(({ label, details, services }) => ({
    label, details, services: services.map((label) => ({ label, value: "Consultar con el taller" })),
  }));

  // Earlier snapshots stored transport mode and customer notes only in the admin text.
  const quotePrefix = groups.map((group) =>
    `${group.label}: ${group.services.map(({ label, value }) => `${label}: ${value}`).join("; ")}`,
  ).join("\n") + "; Subtotal de servicios: ";
  const legacyText = quote && !("customerNotes" in quote)
    ? booking.notes?.split("\n" + quotePrefix)[1]
    : undefined;
  const legacyNotes = legacyText?.match(/^[^\r\n]*; Sujeto a diagnóstico y confirmación\.\r?\n([\s\S]*)$/)?.[1];
  const legacyTransport = legacyText?.match(/; (Retiro \+ entrega|Solo retiro|Solo entrega): [^;]+; Total estimado:/)?.[1];
  const transportLabel = quote?.transportMode ? transportLabels[quote.transportMode] : legacyTransport ?? "Transporte";
  const address = booking.pickup ? [booking.pickupAddress, booking.pickupCommune].filter(Boolean).join(", ") : "";
  const preferred = `${formatDate(booking.preferredDate)}, ${booking.timeSlot === "manana" ? "mañana" : "tarde"}`;
  const rows: SummaryRow[] = [];
  if (quote) {
    rows.push({ label: "Subtotal de servicios", value: formatCLP(quote.subtotal) });
    if (quote.discount) {
      const label = quote.promotion?.applied
        ? `Código ${quote.promotion.code} (−${quote.promotion.percent} %)`
        : "Descuento primer servicio (−10 %)";
      rows.push({ label, value: `−${formatCLP(quote.discount)}` });
    }
    if (quote.promotion && (!quote.promotion.applied || !quote.discount)) {
      rows.push({ label: `Código ${quote.promotion.code}`, value: "Sin descuento adicional" });
    }
  }
  if (booking.pickup) {
    rows.push({ label: transportLabel, value: quote?.transport == null ? "A cotizar" : formatCLP(quote.transport) });
  }
  const total = quote ? `${quote.from ? "Desde " : ""}${formatCLP(quote.total)}` : "Consultar con el taller";
  const pending = quote?.pending ? "Hay valores pendientes de cotizar." : "";
  const observations = quote?.customerNotes ?? legacyNotes;
  const message = [
    "Hola, Tropicleta. Quisiera coordinar la atención de mi cotización.",
    "",
    `Código de solicitud: ${booking.code}`,
    `Nombre: ${booking.name}`,
    "",
    "Vehículos y servicios",
    ...groups.flatMap(({ label, details, services }) => [
      details ? `${label} · ${details}` : label,
      ...services.map(({ label, value }) => `• ${label}: ${value}`),
    ]),
    "",
    ...rows.map(({ label, value }) => `${label}: ${value}`),
    `Total estimado: ${total}`,
    ...(pending ? [pending] : []),
    "",
    `Fecha y horario preferidos: ${preferred}`,
    ...(address ? [`Dirección: ${address}`] : []),
    ...(observations ? [`Observaciones: ${observations}`] : []),
    "",
    "Gracias.",
  ].join("\n");

  return { groups, rows, total, pending, preferred, address, message };
}
