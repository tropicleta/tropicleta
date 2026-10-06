"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { recommendationSchema } from "@/lib/affiliate-validation";
import type { FormState } from "@/lib/forms";

export async function saveRecommendation(_previous: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = recommendationSchema.safeParse({
    name: fd.get("name"), category: fd.get("category"), reason: fd.get("reason"),
    url: fd.get("url"), active: fd.get("active") === "on",
  });
  if (!parsed.success) return { message: parsed.error.issues.map(i => i.message).join(" ") };
  const id = Number(fd.get("id"));
  if (fd.get("id") && (!Number.isSafeInteger(id) || id <= 0)) return { message: "Recomendación inválida." };
  try {
    if (id) await db.update(schema.recommendations).set(parsed.data).where(eq(schema.recommendations.id, id));
    else await db.insert(schema.recommendations).values(parsed.data);
  } catch { return { message: "No pudimos guardar. Intenta nuevamente; tus datos siguen en el formulario." }; }
  revalidatePath("/recomendados/");
  revalidatePath("/admin/recomendados/");
  return { message: "Recomendación guardada." };
}
