import { z } from "zod";
import { localDate, methods } from "./accounting-validation";

export const origins = ["Sin identificar", "Página web", "Instagram", "TikTok", "Google", "Recomendación", "Cliente habitual", "Otro"] as const;
export const recordSchema = z.object({
  kind: z.enum(["servicio", "venta", "gasto"]),
  date: z.iso.date().refine(v => v <= localDate(), "La fecha no puede ser futura"),
  customer: z.string().trim().max(120),
  description: z.string().trim().min(3).max(500),
  amount: z.number().int().min(1).max(2_000_000_000),
  paid: z.boolean(),
  method: z.enum(methods),
  origin: z.enum(origins),
  originDetail: z.string().trim().max(120),
});
export type TropibotRecord = z.infer<typeof recordSchema>;
export const saveRecordSchema = recordSchema.extend({ requestId: z.uuid() });
