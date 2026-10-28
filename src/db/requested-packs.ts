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

export async function renameRequestedBrakePack(db: DB) {
  const summary = "Renombrar pack a Purgado de frenos x2 (28/10/2026)";
  return db.transaction(async (tx) => {
    const [applied] = await tx.select({ id: schema.adminAudit.id }).from(schema.adminAudit)
      .where(and(eq(schema.adminAudit.entity, "service"), eq(schema.adminAudit.summary, summary))).limit(1);
    if (applied) return 0;
    const [pack] = await tx.select().from(schema.services).where(eq(schema.services.slug, "purgado-ambos-frenos"));
    if (!pack) throw new Error("No se encontró el pack de purgado de ambos frenos.");
    await tx.update(schema.services).set({ name: "Purgado de frenos x2" }).where(eq(schema.services.id, pack.id));
    await tx.insert(schema.adminAudit).values({ action: "update", entity: "service", entityId: pack.id.toString(), summary });
    return 1;
  });
}

export async function addRequestedWheelTubelessPack(db: DB) {
  const summary = "Crear Armado de rueda y tubeless x2 por $75.000 (28/10/2026)";
  return db.transaction(async (tx) => {
    const [applied] = await tx.select({ id: schema.adminAudit.id }).from(schema.adminAudit)
      .where(and(eq(schema.adminAudit.entity, "service"), eq(schema.adminAudit.summary, summary))).limit(1);
    if (applied) return 0;
    const catalog = await tx.select().from(schema.services);
    const slug = "armado-rueda-tubeless-x2";
    const existing = catalog.find(s => s.slug === slug);
    let packId = existing?.id;
    if (!existing) {
      const slugs = ["armado-de-rueda", "armado-rueda-trasera", "tubeless-completo", "tubeless-rueda-trasera"];
      const jobs = slugs.map(slug => catalog.find(s => s.slug === slug));
      if (jobs.some(s => !s || !s.active || s.removed || s.kind !== "individual" || s.price !== 20000 || !s.vehicles.includes("bicicleta"))) {
        throw new Error("El pack requiere armado y tubeless de ambas ruedas, activos a $20.000 por trabajo.");
      }
      const included = jobs.filter((s): s is typeof catalog[number] => !!s);
      const category = catalog.find(s => s.slug === "purgado-ambos-frenos")?.categoryId ?? included[0].categoryId;
      const pack = {
        slug, name: "Armado de rueda y tubeless x2", categoryId: category,
        summary: "Armado y tubeless para las ruedas delantera y trasera. Ahorra $5.000 frente a contratarlos por separado.",
        description: "Incluye el armado de la rueda delantera y trasera, más tubeless en ambas ruedas, por $75.000. Los cuatro trabajos cuestan $80.000 por separado. Los rayos se cotizan aparte.",
        includes: included.map(s => s.name), price: 75000, priceFrom: false, kind: "package",
        components: slugs.map(slug => ({ slug, required: true })), vehicles: ["bicicleta"],
        individuallySelectable: true, active: true, sort: 50,
      };
      validateHierarchy([...catalog, pack]);
      const [created] = await tx.insert(schema.services).values(pack).onConflictDoNothing().returning({ id: schema.services.id });
      packId = created?.id;
    }
    await tx.insert(schema.adminAudit).values({ action: "create", entity: "service", entityId: packId?.toString(), summary });
    return existing ? 0 : 1;
  });
}

export async function addRequestedAirForkShockPack(db: DB) {
  const summary = "Crear servicio de horquilla de aire + shock por $95.000 (28/10/2026)";
  return db.transaction(async (tx) => {
    const [applied] = await tx.select({ id: schema.adminAudit.id }).from(schema.adminAudit)
      .where(and(eq(schema.adminAudit.entity, "service"), eq(schema.adminAudit.summary, summary))).limit(1);
    if (applied) return 0;
    const catalog = await tx.select().from(schema.services);
    const slug = "pack-horquilla-aire-shock";
    const existing = catalog.find(s => s.slug === slug);
    if (!existing) {
      const slugs = ["servicio-completo-horquilla", "servicio-amortiguador"];
      const jobs = slugs.map(slug => catalog.find(s => s.slug === slug));
      if (jobs.some(s => !s || !s.active || s.removed || s.kind !== "individual" || s.price !== 50000 || !s.vehicles.includes("bicicleta"))) {
        throw new Error("El pack requiere servicio de horquilla de aire y shock activos a $50.000 cada uno.");
      }
      const included = jobs.filter((s): s is typeof catalog[number] => !!s);
      const pack = {
        slug, name: "Servicio de horquilla de aire + shock",
        categoryId: catalog.find(s => s.slug === "pack-mantencion-completa-cuadro")?.categoryId ?? included[0].categoryId,
        summary: "Servicio de horquilla de aire y shock por $95.000. Ahorra $5.000 frente a contratarlos por separado.",
        description: "Incluye el servicio completo de horquilla de aire ($50.000) y el servicio de shock ($50.000) por $95.000. Repuestos y trabajos adicionales se cotizan aparte.",
        includes: included.map(s => s.name), price: 95000, priceFrom: false, kind: "package",
        components: slugs.map(slug => ({ slug, required: true })), vehicles: ["bicicleta"],
        individuallySelectable: true, active: true, sort: 48,
      };
      validateHierarchy([...catalog, pack]);
      await tx.insert(schema.services).values(pack).onConflictDoNothing();
    }
    await tx.insert(schema.adminAudit).values({ action: "create", entity: "service", entityId: slug, summary });
    return existing ? 0 : 1;
  });
}

export async function replaceRequestedShockFramePack(db: DB) {
  const summary = "Reemplazar shock+cuadro por mantención completa+cuadro a $70.000 (28/10/2026)";
  return db.transaction(async (tx) => {
    const [applied] = await tx.select({ id: schema.adminAudit.id }).from(schema.adminAudit)
      .where(and(eq(schema.adminAudit.entity, "service"), eq(schema.adminAudit.summary, summary))).limit(1);
    if (applied) return 0;
    const catalog = await tx.select().from(schema.services);
    const maintenance = catalog.find(s => s.slug === "mantencion-completa");
    const frame = catalog.find(s => s.slug === "servicio-al-cuadro");
    if (!maintenance || !frame || maintenance.price !== 50000 || frame.price !== 25000 ||
        [maintenance, frame].some(s => !s.active || s.removed || !s.vehicles.includes("bicicleta"))) {
      throw new Error("El pack requiere mantención completa activa de $50.000 y servicio al cuadro de $25.000.");
    }
    const slug = "pack-mantencion-completa-cuadro";
    const existing = catalog.find(s => s.slug === slug);
    const pack = {
      slug, name: "Mantención completa + servicio al cuadro", categoryId: maintenance.categoryId,
      summary: "Mantención completa de tu bicicleta más servicio al cuadro por $70.000.",
      description: "Incluye la mantención completa ($50.000) y el servicio al cuadro ($25.000) por $70.000. Repuestos y trabajos adicionales se cotizan aparte.",
      includes: [maintenance.name, frame.name], price: 70000, priceFrom: false, kind: "package",
      components: [{ slug: maintenance.slug, required: true }, { slug: frame.slug, required: true }],
      vehicles: ["bicicleta"], individuallySelectable: true, active: true, sort: 49,
    };
    validateHierarchy([
      ...catalog.map(s => s.slug === "pack-shock-cuadro" ? { ...s, active: false } : s),
      ...(existing ? [] : [pack]),
    ]);
    await tx.update(schema.services).set({ active: false, featured: false }).where(eq(schema.services.slug, "pack-shock-cuadro"));
    if (!existing) await tx.insert(schema.services).values(pack).onConflictDoNothing();
    await tx.insert(schema.adminAudit).values({ action: "update", entity: "service", entityId: slug, summary });
    return existing ? 0 : 1;
  });
}
