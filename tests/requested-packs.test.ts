import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import type { DB } from "../src/db/client";
import { addRequestedShockFramePack } from "../src/db/requested-packs";
import { packageQuote, validateHierarchy } from "../src/lib/package-quote";
import { packageReference } from "../src/lib/package-reference";
import { serviceQuote } from "../src/lib/service-quote";

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
    console.log("Pack: $70.000 directo y automático, $5.000 de ahorro, sin duplicados y sin sobrescribir cambios posteriores.");
  } finally { await client.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
