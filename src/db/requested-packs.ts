import { and, eq } from "drizzle-orm";
import type { DB } from "./client";
import * as schema from "./schema";

const marker = "Pack shock + cuadro de $70.000 solicitado el 28/10/2026";
const slug = "pack-shock-cuadro";

/** Apply this catalog request once, preserving subsequent Admin edits or removal. */
export async function addRequestedShockFramePack(db: DB) {
  return db.transaction(async (tx) => {
    const [applied] = await tx.select({ id: schema.adminAudit.id }).from(schema.adminAudit)
      .where(and(eq(schema.adminAudit.entity, "service"), eq(schema.adminAudit.summary, marker))).limit(1);
    if (applied) return 0;
    const [existing] = await tx.select().from(schema.services).where(eq(schema.services.slug, slug));
    let serviceId = existing?.id;
    let added = 0;
    if (!existing) {
      const [shock] = await tx.select().from(schema.services).where(eq(schema.services.slug, "servicio-amortiguador"));
      const [frame] = await tx.select().from(schema.services).where(eq(schema.services.slug, "servicio-al-cuadro"));
      if (!shock || !frame || shock.price !== 50000 || frame.price !== 25000 ||
          [shock, frame].some(s => !s.active || s.removed || s.kind !== "individual" || !s.vehicles.includes("bicicleta") || s.requiresDoubleSuspension || s.excludesDoubleSuspension)) {
        throw new Error("El pack shock + cuadro requiere sus dos servicios activos, compatibles con bicicleta, a $50.000 y $25.000.");
      }
      const [category] = await tx.select().from(schema.serviceCategories).where(eq(schema.serviceCategories.slug, "packs"));
      const [existingPack] = await tx.select({ categoryId: schema.services.categoryId }).from(schema.services).where(eq(schema.services.slug, "pack-doble-suspension"));
      const [created] = await tx.insert(schema.services).values({
        slug, name: "Pack shock + cuadro (doble suspensión)", categoryId: category?.id ?? existingPack?.categoryId ?? shock.categoryId,
        summary: "Servicio de shock y cuadro para tu bicicleta de doble suspensión. Ahorra $5.000 frente a contratarlos por separado.",
        description: "Incluye el servicio de shock ($50.000) y el servicio del cuadro ($25.000) por $70.000. El alcance final se confirma al revisar la bicicleta; los repuestos y trabajos adicionales se cotizan aparte.",
        includes: [shock.name, frame.name], price: 70000, priceFrom: false, kind: "package",
        components: [{ slug: shock.slug, required: true }, { slug: frame.slug, required: true }],
        vehicles: ["bicicleta"], individuallySelectable: true, active: true, sort: 49,
      }).onConflictDoNothing().returning({ id: schema.services.id });
      if (created) { serviceId = created.id; added = 1; }
    }
    await tx.insert(schema.adminAudit).values({ action: "create", entity: "service", entityId: serviceId?.toString(), summary: marker });
    return added;
  });
}
