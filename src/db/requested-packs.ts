import { and, eq } from "drizzle-orm";
import type { DB } from "./client";
import * as schema from "./schema";
import { validateHierarchy } from "../lib/package-quote";

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

/** Retire the two superseded packs and install the two-brake price once. */
export async function updateRequestedBrakePacks(db: DB) {
  const summary = "Retirar packs completa+purgado y doble suspensión; ambos frenos por $25.000 (28/10/2026)";
  return db.transaction(async (tx) => {
    const [applied] = await tx.select({ id: schema.adminAudit.id }).from(schema.adminAudit)
      .where(and(eq(schema.adminAudit.entity, "service"), eq(schema.adminAudit.summary, summary))).limit(1);
    if (applied) return 0;
    const catalog = await tx.select().from(schema.services);
    const retired = new Set(["mantencion-completa-sangrado", "pack-doble-suspension"]);
    const front = catalog.find(s => s.slug === "purga-frenos-hidraulicos");
    const rear = catalog.find(s => s.slug === "sangrado-freno-trasero");
    if (!front || !rear || [front, rear].some(s => !s.active || s.removed || s.price !== 15000 || s.kind !== "individual" || !s.vehicles.includes("bicicleta"))) {
      throw new Error("El pack de purgado requiere ambos servicios individuales activos a $15.000 cada uno.");
    }
    const brakeSlug = "purgado-ambos-frenos";
    const existing = catalog.find(s => s.slug === brakeSlug);
    const previousPack = catalog.find(s => retired.has(s.slug));
    const pack = {
      slug: brakeSlug, name: "Purgado de ambos frenos", categoryId: previousPack?.categoryId ?? front.categoryId,
      summary: "Purgado del freno delantero y trasero por $25.000. Ahorra $5.000 frente a contratarlos por separado.",
      description: "Incluye el purgado de los dos frenos hidráulicos de tu bicicleta. Cada freno cuesta $15.000 por separado; el pack cuesta $25.000. Los repuestos y trabajos adicionales se cotizan aparte.",
      includes: [front.name, rear.name], price: 25000, priceFrom: false, kind: "package",
      components: [{ slug: front.slug, required: true }, { slug: rear.slug, required: true }],
      vehicles: ["bicicleta"], individuallySelectable: true, active: true, sort: 46,
    };
    validateHierarchy([
      ...catalog.map(s => retired.has(s.slug) ? { ...s, active: false } : s),
      ...(existing ? [] : [pack]),
    ]);
    for (const service of catalog.filter(s => retired.has(s.slug))) {
      await tx.update(schema.services).set({ active: false, featured: false }).where(eq(schema.services.id, service.id));
    }
    if (!existing) await tx.insert(schema.services).values(pack).onConflictDoNothing();
    await tx.insert(schema.adminAudit).values({ action: "update", entity: "service", entityId: brakeSlug, summary });
    return existing ? 0 : 1;
  });
}

/** Clarification: keep full maintenance + bleeding; retire only the old suspension bundle. */
export async function restoreRequestedFullMaintenancePack(db: DB) {
  const summary = "Conservar completa+purgado; retirar solo doble suspensión $140.000 (28/10/2026)";
  return db.transaction(async (tx) => {
    const [applied] = await tx.select({ id: schema.adminAudit.id }).from(schema.adminAudit)
      .where(and(eq(schema.adminAudit.entity, "service"), eq(schema.adminAudit.summary, summary))).limit(1);
    if (applied) return 0;
    const catalog = await tx.select().from(schema.services);
    const pack = catalog.find(s => s.slug === "mantencion-completa-sangrado");
    if (!pack || pack.kind !== "package") throw new Error("No se encontró el pack de mantención completa y purgado.");
    validateHierarchy(catalog.map(s => s.id === pack.id ? { ...s, active: true, removed: false } : s.slug === "pack-doble-suspension" ? { ...s, active: false } : s));
    await tx.update(schema.services).set({ active: true, removed: false }).where(eq(schema.services.id, pack.id));
    await tx.update(schema.services).set({ active: false, featured: false }).where(eq(schema.services.slug, "pack-doble-suspension"));
    await tx.insert(schema.adminAudit).values({ action: "update", entity: "service", entityId: pack.id.toString(), summary });
    return 1;
  });
}

/** Final request: remove full maintenance + bleeding as well. */
export async function retireRequestedFullMaintenancePack(db: DB) {
  const summary = "Retirar también mantención completa+purgado (aclaración final 28/10/2026)";
  return db.transaction(async (tx) => {
    const [applied] = await tx.select({ id: schema.adminAudit.id }).from(schema.adminAudit)
      .where(and(eq(schema.adminAudit.entity, "service"), eq(schema.adminAudit.summary, summary))).limit(1);
    if (applied) return 0;
    const catalog = await tx.select().from(schema.services);
    const pack = catalog.find(s => s.slug === "mantencion-completa-sangrado");
    if (!pack) throw new Error("No se encontró el pack de mantención completa y purgado.");
    validateHierarchy(catalog.map(s => s.id === pack.id ? { ...s, active: false } : s));
    await tx.update(schema.services).set({ active: false, featured: false }).where(eq(schema.services.id, pack.id));
    await tx.insert(schema.adminAudit).values({ action: "update", entity: "service", entityId: pack.id.toString(), summary });
    return 1;
  });
}
