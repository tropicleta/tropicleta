import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq, inArray } from "drizzle-orm";
import * as schema from "../src/db/schema";
import type { DB } from "../src/db/client";
import { addRequestedShockFramePack, updateRequestedBrakePacks, restoreRequestedFullMaintenancePack, retireRequestedFullMaintenancePack, renameRequestedBrakePack, addRequestedWheelTubelessPack, replaceRequestedShockFramePack } from "../src/db/requested-packs";
import { packageQuote, validateHierarchy } from "../src/lib/package-quote";
import { packageReference } from "../src/lib/package-reference";
import { serviceQuote } from "../src/lib/service-quote";
import { addRequestedAirForkShockPack } from "../src/db/requested-packs";

async function main() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    const [oldPack] = await db.select().from(schema.services).where(eq(schema.services.slug, "pack-doble-suspension"));
    assert.equal(await addRequestedShockFramePack(db as unknown as DB), 1);
    const catalog = await db.select().from(schema.services);
    const pack = catalog.find(s => s.slug === "pack-shock-cuadro")!;
    validateHierarchy(catalog);
    assert.deepEqual(packageReference(catalog, pack), { reference: 75000, savings: 5000 });
    for (const selection of [
      { manual: [], packages: [pack.slug], excluded: [] },
      { manual: ["servicio-amortiguador", "servicio-al-cuadro"], packages: [], excluded: [] },
      { manual: ["servicio-amortiguador", "servicio-al-cuadro"], packages: [pack.slug], excluded: [] },
    ]) {
      const quote = packageQuote(catalog, selection, "bicicleta");
      assert.equal(quote.lines.length, 1);
      assert.equal(quote.lines[0].slug, pack.slug);
      assert.equal(serviceQuote(quote.lines).total, 70000);
    }
    assert.throws(() => packageQuote(catalog, { manual: [], packages: [pack.slug], excluded: [] }, "scooter"));
    assert.deepEqual(catalog.find(s => s.id === oldPack.id), oldPack);
    assert.equal(await addRequestedShockFramePack(db as unknown as DB), 0);
    await db.update(schema.services).set({ slug: "pack-renombrado", price: 72000, removed: true, active: false }).where(eq(schema.services.id, pack.id));
    assert.equal(await addRequestedShockFramePack(db as unknown as DB), 0);
    const preserved = await db.select().from(schema.services).where(eq(schema.services.id, pack.id));
    assert.equal(preserved[0].price, 72000);
    assert.equal(preserved[0].removed, true);
    assert.equal((await db.select().from(schema.services).where(eq(schema.services.slug, "pack-shock-cuadro"))).length, 0);
    assert.equal(await updateRequestedBrakePacks(db as unknown as DB), 1);
    const brakes = await db.select().from(schema.services);
    const brakePack = brakes.find(s => s.slug === "purgado-ambos-frenos")!;
    assert.deepEqual(packageReference(brakes, brakePack), { reference: 30000, savings: 5000 });
    for (const selection of [
      { manual: [], packages: [brakePack.slug], excluded: [] },
      { manual: ["purga-frenos-hidraulicos", "sangrado-freno-trasero"], packages: [], excluded: [] },
      { manual: ["purga-frenos-hidraulicos", "sangrado-freno-trasero"], packages: [brakePack.slug], excluded: [] },
    ]) {
      const quote = packageQuote(brakes, selection, "bicicleta");
      assert.equal(quote.lines.length, 1);
      assert.equal(serviceQuote(quote.lines).total, 25000);
    }
    assert.equal(brakes.find(s => s.slug === "mantencion-completa-sangrado")!.active, false);
    assert.equal(brakes.find(s => s.slug === "pack-doble-suspension")!.active, false);
    for (const slug of ["purga-frenos-hidraulicos", "sangrado-freno-trasero"]) {
      assert.equal(serviceQuote(packageQuote(brakes, { manual: [slug], packages: [], excluded: [] }, "bicicleta").lines).total, 15000);
    }
    await db.update(schema.services).set({ price: 26000 }).where(eq(schema.services.id, brakePack.id));
    assert.equal(await updateRequestedBrakePacks(db as unknown as DB), 0);
    assert.equal((await db.select().from(schema.services).where(eq(schema.services.id, brakePack.id)))[0].price, 26000);
    // Match the live catalog: these maintenance components are already published.
    await db.update(schema.services).set({ active: true }).where(inArray(schema.services.slug, ["mantencion-basica", "mantencion-completa"]));
    assert.equal(await restoreRequestedFullMaintenancePack(db as unknown as DB), 1);
    const corrected = await db.select().from(schema.services);
    const restored = corrected.find(s => s.slug === "mantencion-completa-sangrado")!;
    assert.equal(restored.active, true);
    assert.equal(restored.price, 70000);
    assert.equal(corrected.find(s => s.slug === "pack-doble-suspension")!.active, false);
    assert.equal(serviceQuote(packageQuote(corrected, { manual: [], packages: [restored.slug], excluded: [] }, "bicicleta").lines).total, 70000);
    assert.equal(await restoreRequestedFullMaintenancePack(db as unknown as DB), 0);
    assert.equal(await retireRequestedFullMaintenancePack(db as unknown as DB), 1);
    const final = await db.select().from(schema.services);
    assert.equal(final.find(s => s.slug === "mantencion-completa-sangrado")!.active, false);
    assert.equal(final.find(s => s.slug === "pack-doble-suspension")!.active, false);
    assert.equal(final.find(s => s.slug === "purgado-ambos-frenos")!.active, true);
    assert.equal(final.find(s => s.slug === "purgado-ambos-frenos")!.price, 26000); // Admin edit remains untouched.
    assert.equal(final.find(s => s.slug === "mantencion-completa")!.active, true);
    assert.equal(await retireRequestedFullMaintenancePack(db as unknown as DB), 0);
    assert.equal(await renameRequestedBrakePack(db as unknown as DB), 1);
    const [renamed] = await db.select().from(schema.services).where(eq(schema.services.id, brakePack.id));
    assert.equal(renamed.name, "Purgado de frenos x2");
    assert.equal(renamed.price, 26000); // Renaming must not overwrite the administrator's price.
    assert.deepEqual(renamed.components, brakePack.components);
    assert.equal(await renameRequestedBrakePack(db as unknown as DB), 0);
    assert.equal(await addRequestedWheelTubelessPack(db as unknown as DB), 1);
    const wheels = await db.select().from(schema.services);
    const wheelPack = wheels.find(s => s.slug === "armado-rueda-tubeless-x2")!;
    assert.deepEqual(packageReference(wheels, wheelPack), { reference: 80000, savings: 5000 });
    const wheelSlugs = ["armado-de-rueda", "armado-rueda-trasera", "tubeless-completo", "tubeless-rueda-trasera"];
    for (const selection of [
      { manual: [], packages: [wheelPack.slug], excluded: [] },
      { manual: wheelSlugs, packages: [], excluded: [] },
      { manual: wheelSlugs, packages: [wheelPack.slug], excluded: [] },
    ]) {
      const quote = packageQuote(wheels, selection, "bicicleta");
      assert.equal(quote.lines.length, 1);
      assert.equal(serviceQuote(quote.lines).total, 75000);
    }
    assert.equal(serviceQuote(packageQuote(wheels, { manual: ["armado-de-rueda", "tubeless-completo"], packages: [], excluded: [] }, "bicicleta").lines).total, 40000);
    assert.equal(await addRequestedWheelTubelessPack(db as unknown as DB), 0);
    await db.update(schema.services).set({ slug: "pack-shock-cuadro", active: true, removed: false, price: 70000 }).where(eq(schema.services.id, pack.id));
    assert.equal(await replaceRequestedShockFramePack(db as unknown as DB), 1);
    const maintenanceCatalog = await db.select().from(schema.services);
    const maintenancePack = maintenanceCatalog.find(s => s.slug === "pack-mantencion-completa-cuadro")!;
    assert.equal(maintenanceCatalog.find(s => s.slug === "pack-shock-cuadro")!.active, false);
    assert.deepEqual(maintenancePack.components, [{ slug: "mantencion-completa", required: true }, { slug: "servicio-al-cuadro", required: true }]);
    for (const selection of [
      { manual: [], packages: [maintenancePack.slug], excluded: [] },
      { manual: ["servicio-al-cuadro"], packages: ["mantencion-completa"], excluded: [] },
      { manual: ["servicio-al-cuadro"], packages: [maintenancePack.slug, "mantencion-completa"], excluded: [] },
    ]) {
      const quote = packageQuote(maintenanceCatalog, selection, "bicicleta");
      assert.equal(quote.lines.length, 1);
      assert.equal(serviceQuote(quote.lines).total, 70000);
      assert.equal(quote.leaves.includes("servicio-amortiguador"), false);
    }
    assert.equal(await replaceRequestedShockFramePack(db as unknown as DB), 0);
    assert.equal(await addRequestedAirForkShockPack(db as unknown as DB), 1);
    const suspensionCatalog = await db.select().from(schema.services);
    const suspensionPack = suspensionCatalog.find(s => s.slug === "pack-horquilla-aire-shock")!;
    assert.deepEqual(packageReference(suspensionCatalog, suspensionPack), { reference: 100000, savings: 5000 });
    assert.deepEqual(suspensionPack.components, [{ slug: "servicio-completo-horquilla", required: true }, { slug: "servicio-amortiguador", required: true }]);
    for (const selection of [
      { manual: [], packages: [suspensionPack.slug], excluded: [] },
      { manual: ["servicio-completo-horquilla", "servicio-amortiguador"], packages: [], excluded: [] },
      { manual: ["servicio-completo-horquilla", "servicio-amortiguador"], packages: [suspensionPack.slug], excluded: [] },
    ]) {
      const quote = packageQuote(suspensionCatalog, selection, "bicicleta");
      assert.equal(quote.lines.length, 1);
      assert.equal(serviceQuote(quote.lines).total, 95000);
      assert.deepEqual(new Set(quote.leaves), new Set(["servicio-completo-horquilla", "servicio-basico-horquilla", "servicio-amortiguador"]));
    }
    assert.throws(() => packageQuote(suspensionCatalog, { manual: [], packages: [suspensionPack.slug], excluded: [] }, "scooter"));
    await db.update(schema.services).set({ price: 96000 }).where(eq(schema.services.id, suspensionPack.id));
    assert.equal(await addRequestedAirForkShockPack(db as unknown as DB), 0);
    assert.equal((await db.select().from(schema.services).where(eq(schema.services.id, suspensionPack.id)))[0].price, 96000);
    console.log("Horquilla de aire + shock: $95.000, ahorro $5.000, sin duplicados y cambios posteriores conservados.");
    console.log("Pack: $70.000 directo y automático, $5.000 de ahorro, sin duplicados y sin sobrescribir cambios posteriores.");
    console.log("Frenos: dos por $25.000, uno por $15.000, packs retirados y cambios posteriores conservados.");
    console.log("Aclaración final: completa + purgado retirada; mantención completa y pack de ambos frenos conservados.");
    console.log("Ruedas: armado + tubeless en ambas por $75.000, ahorro de $5.000 y reconocimiento sin duplicados.");
    console.log("Mantención completa + cuadro por $70.000, sin incluir shock ni duplicar trabajos; pack anterior retirado.");
  } finally { await client.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
