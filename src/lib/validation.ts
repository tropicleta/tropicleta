import { z } from "zod";
import { normalizeChileanPhone } from "./format";
import { deliveryCommunes } from "@/data/shop";

const trimmed = (msg: string, min = 1, max = 200) =>
  z.string({ error: msg }).trim().min(min, msg).max(max, `Máximo ${max} caracteres`);

export const phoneSchema = z
  .string({ error: "Ingresa tu celular" })
  .trim()
  .transform((v, ctx) => {
    const n = normalizeChileanPhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Ingresa un celular válido, ej: 9 1234 5678" });
      return z.NEVER;
    }
    return n;
  });

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.email("Email no válido").optional());

export const contactSchema = z
  .object({
    name: trimmed("Ingresa tu nombre", 2, 80),
    phone: z.string().trim().optional(),
    email: optionalEmail,
    message: trimmed("Cuéntanos en qué te ayudamos (mínimo 10 caracteres)", 10, 2000),
    subject: z.enum(["contacto", "eventos"]).default("contacto"),
    eventDate: z.string().trim().max(20).optional(),
    eventPlace: z.string().trim().max(120).optional(),
    attendees: z.string().trim().max(10).optional(),
    website: z.string().max(0, "spam").optional(), // honeypot
  })
  .superRefine((d, ctx) => {
    if (!d.phone && !d.email) ctx.addIssue({ code: "custom", path: ["phone"], message: "Déjanos un celular o un email" });
    if (d.phone && !normalizeChileanPhone(d.phone))
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Ingresa un celular válido, ej: 9 1234 5678" });
  });

function todayInChile() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" }); // YYYY-MM-DD
}

export const bookingSchema = z
  .object({
    name: trimmed("Ingresa tu nombre", 2, 80),
    phone: phoneSchema,
    email: optionalEmail,
    vehicleType: z.string().trim().min(1, "Elige el tipo de vehículo").max(20),
    doubleSuspension: z.string().optional().transform(v => v === "on"),
    selection: z.string().max(12000).optional(),
    vehicleQuotes: z.string().max(80000).optional(),
    vehicleDetails: z.string().trim().max(200).optional(),
    services: z
      .union([z.string(), z.array(z.string())], { error: "Elige al menos un servicio" })
      .transform((v) => (Array.isArray(v) ? v : [v]))
      .pipe(z.array(z.string().min(1)).min(1, "Elige al menos un servicio").max(400)),
    preferredDate: z
      .string({ error: "Elige una fecha" })
      .pipe(z.iso.date("Elige una fecha válida"))
      .refine((d) => d > todayInChile(), "Elige una fecha desde mañana"),
    timeSlot: z.enum(["manana", "tarde"], { error: "Elige un bloque" }),
    pickup: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    pickupCommune: z.string().optional(),
    transportMode: z.enum(["both", "pickup", "delivery"]).default("both"),
    firstService: z.string().optional().transform(v => v === "on"),
    pickupAddress: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(1000).optional(),
    website: z.string().max(0, "spam").optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.pickup) return;
    if (!deliveryCommunes.includes(d.pickupCommune as never))
      ctx.addIssue({ code: "custom", path: ["pickupCommune"], message: "Elige una comuna con cobertura" });
    if (!d.pickupAddress || d.pickupAddress.length < 5)
      ctx.addIssue({ code: "custom", path: ["pickupAddress"], message: "Ingresa la dirección para el transporte" });
  });

export const checkoutSchema = z
  .object({
    name: trimmed("Ingresa tu nombre", 2, 80),
    email: z.email("Ingresa un email válido"),
    phone: phoneSchema,
    deliveryMethod: z.enum(["retiro", "despacho"], { error: "Elige retiro o despacho" }),
    commune: z.string().optional(),
    address: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(500).optional(),
    paymentMethod: z.literal("mercadopago", { error: "El pago se realiza con Mercado Pago" }),
    items: z
      .string()
      .transform((v, ctx) => {
        try {
          return JSON.parse(v) as unknown;
        } catch {
          ctx.addIssue({ code: "custom", message: "Carrito inválido" });
          return z.NEVER;
        }
      })
      .pipe(
        z
          .array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(10) }))
          .min(1, "Tu carrito está vacío")
          .max(50),
      ),
  })
  .superRefine((d, ctx) => {
    if (d.deliveryMethod !== "despacho") return;
    if (!deliveryCommunes.includes(d.commune as never))
      ctx.addIssue({ code: "custom", path: ["commune"], message: "Elige una comuna con despacho" });
    if (!d.address || d.address.length < 5)
      ctx.addIssue({ code: "custom", path: ["address"], message: "Ingresa tu dirección" });
  });
