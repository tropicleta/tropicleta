"use server";
import { persistTropibotRecord } from "@/lib/tropibot-store";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { saveRecordSchema } from "@/lib/tropibot-validation";

export async function saveTropibotRecord(input: unknown) {
  await requireAdmin();
  const parsed = saveRecordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisa la fecha, descripción y monto del registro." };
  const { requestId, ...data } = parsed.data;
  try {
    const id = await persistTropibotRecord(db, parsed.data);
    if (id) await audit("crear", "tropibot", id, data.description);
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Registro guardado. Los movimientos pagados ya aparecen en Contabilidad." };
  } catch { return { ok: false, message: "No se pudo guardar. Puedes reintentar sin duplicar el registro." }; }
}
