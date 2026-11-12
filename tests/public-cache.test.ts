import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

/** Real Next unstable_cache + an isolated cache backend, with real SQL query counting. */
async function main() {
  const globals = globalThis as Record<string, unknown>;
  globals.AsyncLocalStorage ??= AsyncLocalStorage;
  const entries = new Map<string, { value: { revalidate: number }; tags: string[]; storedAt: number }>();
  let now = 0;
  globals.__incrementalCache = {
    generateSimpleCacheKey: async (key: string) => createHash("sha256").update(key).digest("hex"),
    get: async (key: string) => {
      const entry = entries.get(key);
      return entry ? { value: entry.value, isStale: now - entry.storedAt >= entry.value.revalidate } : null;
    },
    set: async (key: string, value: { revalidate: number }, context: { tags: string[] }) => {
      entries.set(key, { value, tags: context.tags, storedAt: now });
    },
  };
  const invalidate = (tag: string) => {
    for (const [key, entry] of entries) if (entry.tags.includes(tag)) entries.delete(key);
  };
  const client = new PGlite();
  let queries = 0;
  const db = drizzle(client, { schema, logger: { logQuery: () => { queries++; } } });
  globals.__tpDb = db;
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    const [category] = await db.insert(schema.productCategories).values({ slug: "cache-test", name: "Prueba" }).returning();
    const [product] = await db.insert(schema.products).values({ slug: "cache-product", categoryId: category.id, name: "Producto", price: 1000, stock: 2, featured: true }).returning();
    await db.insert(schema.products).values({ slug: "cache-product-expensive", categoryId: category.id, name: "Otro producto", price: 3000 });
    await db.insert(schema.recommendations).values({ name: "Recomendado", category: "Prueba", reason: "Prueba", url: "https://meli.la/prueba", active: true });
    const q = await import("../src/lib/queries");

    await q.getRecommendations();
    await q.getQuoteVehicles();
    await q.getServiceCatalog();
    await q.getPublicSitemapSlugs();
    await q.getProducts();
    const warmed = queries;
    for (let i = 0; i < 10; i++) {
      await q.getRecommendations();
      await q.getQuoteVehicles();
      await q.getPublicSitemapSlugs();
      assert.equal(await q.getService(`unknown-service-${i}`), null);
      assert.equal(await q.getProduct(`unknown-product-${i}`), null);
      assert.equal((await q.getProducts({ category: `unknown-category-${i}` })).length, 0);
      assert.deepEqual((await q.getProducts({ category: category.slug, sort: "precio-asc" })).map(p => p.price), [1000, 3000]);
      assert.deepEqual((await q.getProducts({ category: category.slug, sort: "precio-desc" })).map(p => p.price), [3000, 1000]);
      await q.getFeaturedProducts();
      await q.getActiveServiceSlugs();
    }
    assert.equal(queries, warmed, "Repeated visits, sorting and unknown URLs must issue no new SQL after warming.");

    await db.update(schema.products).set({ stock: 0, price: 1200 }).where(eq(schema.products.id, product.id));
    assert.equal((await q.getProduct(product.slug))!.product.stock, 2);
    assert.equal((await q.getProductsByIds([product.id]))[0].stock, 0, "Checkout must bypass the public snapshot.");
    assert.equal((await q.getProductsByIds([product.id]))[0].price, 1200);
    invalidate(q.CACHE_TAGS.shop);
    assert.equal((await q.getProduct(product.slug))!.product.stock, 0);
    assert.equal((await q.getFeaturedProducts()).some(p => p.slug === product.slug), false);
    await q.getPublicSitemapSlugs(); // Stock invalidation also expires the shop's URL snapshot.

    await db.update(schema.recommendations).set({ active: false });
    assert.equal((await q.getRecommendations()).length, 1);
    invalidate(q.CACHE_TAGS.recommendations);
    assert.equal((await q.getRecommendations()).length, 0);

    const beforeExpiry = queries;
    now = 301;
    await q.getRecommendations();
    await q.getQuoteVehicles();
    await q.getPublicSitemapSlugs();
    assert.equal(queries, beforeExpiry, "Stable content must survive the five-minute stock refresh window.");
    await q.getProducts();
    assert.equal(queries, beforeExpiry + 1, "Only the stock snapshot should refresh after five minutes.");
    console.log("Public cache: repeated visits and URL variants reuse data; edits invalidate snapshots; checkout reads live price and stock.");
  } finally {
    delete globals.__tpDb;
    delete globals.__incrementalCache;
    await client.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
