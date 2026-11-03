"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { allowPublicSubmission } from "@/lib/public-limit";
import { promotionCodeSchema } from "@/lib/promotion";
import { findPromotion } from "@/lib/promotions";
import type { FormState } from "@/lib/forms";

export async function checkPromotion(input: string) {
  if (typeof input !== "string" || input.length > 64 || !(await allowPublicSubmission("promotion", 15, 15))) return { message: "Espera unos minutos antes de volver a comprobar." };
  try {
    const promotion = await findPromotion(input);
    return promotion ? { promotion, message: "Código válido." } : { message: "Este código no existe, venció o está desactivado." };
  } catch { return { message: "No pudimos comprobar el código. Intenta nuevamente." }; }
}

export async function savePromotion(_previous: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z.object({ code: promotionCodeSchema, percent: z.coerce.number().int().min(1).max(100), expiresOn: z.union([z.literal(""), z.iso.date()]) }).safeParse({ code: fd.get("code"), percent: fd.get("percent"), expiresOn: fd.get("expiresOn") ?? "" });
  if (!parsed.success) return { message: "Revisa el código, el porcentaje (1 a 100) y la fecha." };
  const { code, percent, expiresOn } = parsed.data;
  await db.insert(schema.promotions).values({ code, percent, expiresOn: expiresOn || null, active: true }).onConflictDoUpdate({ target: schema.promotions.code, set: { percent, expiresOn: expiresOn || null, active: true } });
  revalidatePath("/admin/promociones/");
  return { ok: true, message: `Código ${code} guardado: ${percent}% de descuento.` };
}

export async function togglePromotion(fd: FormData) {
  await requireAdmin();
  const code = promotionCodeSchema.parse(fd.get("code"));
  await db.update(schema.promotions).set({ active: fd.get("active") === "true" }).where(eq(schema.promotions.code, code));
  revalidatePath("/admin/promociones/");
}
