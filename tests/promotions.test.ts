import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/db/schema";
import { applyPromotion, promotionCodeSchema, promotionIsValid } from "../src/lib/promotion";
import { serviceQuote } from "../src/lib/service-quote";

async function main() {
  assert.equal(promotionCodeSchema.parse(" pedalea10 "), "PEDALEA10");
  assert.equal(promotionCodeSchema.safeParse("<script>").success, false);
  assert.equal(promotionIsValid({ active: true, expiresOn: "2026-11-03" }, "2026-11-03"), true);
  assert.equal(promotionIsValid({ active: true, expiresOn: "2026-11-02" }, "2026-11-03"), false);
  assert.equal(promotionIsValid({ active: false, expiresOn: null }), false);
  const quote = serviceQuote([{ slug: "test", name: "Servicio", price: 20000, priceFrom: false }], true, "Tierra Amarilla", "both", true);
  const larger = applyPromotion(quote, { code: "INSTAGRAM20", percent: 20 });
  assert.equal(larger.total, 21000); // 20,000 minus 20%, plus full 5,000 transport
  assert.equal(larger.discount, 4000);
  const smaller = applyPromotion(quote, { code: "INSTAGRAM5", percent: 5 });
  assert.equal(smaller.discount, 2000); // first visit retained, never stacked
  assert.equal(smaller.promotion?.applied, false);
  assert.equal(applyPromotion(quote, { code: "TOTAL100", percent: 100 }).total, 5000);
  const client = new PGlite();
  const db = drizzle(client, { schema });
  (globalThis as Record<string, unknown>).__tpDb = db;
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    const { findPromotion } = await import("../src/lib/promotions");
    await db.insert(schema.promotions).values([
      { code: "INSTAGRAM20", percent: 20 },
      { code: "DISABLED", percent: 15, active: false },
      { code: "EXPIRED", percent: 10, expiresOn: "2020-01-01" },
    ]);
    assert.deepEqual(await findPromotion("instagram20"), { code: "INSTAGRAM20", percent: 20 });
    for (const code of ["DISABLED", "EXPIRED", "UNKNOWN", "' OR 1=1 --"]) assert.equal(await findPromotion(code), null);
    await assert.rejects(db.insert(schema.promotions).values({ code: "INVALID", percent: 101 }));
  } finally { await client.close(); }
  console.log("OK: promotions migration, validity, rounding, server lookup, transport and non-stacking.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
