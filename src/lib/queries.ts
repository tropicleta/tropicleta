import "server-only";
import { shortServiceName } from "./service-visuals";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/db";
import { fallbackCategories, fallbackFeatured } from "@/data/services-fallback";

const { services, serviceCategories, products, productCategories } = schema;

/**
 * Caché de datos públicos (Data Cache de Next): las páginas siguen siendo dinámicas, pero no consultan la BD
 * en cada visita. Se invalida por tag desde el panel (`revalidatePublicData`) y al descontar stock.
 * Ojo: el caché serializa a JSON, así que los `Date` (products.createdAt) vuelven como string; no se usan en el sitio.
 */
export const CACHE_TAGS = { catalog: "catalogo", shop: "tienda", recommendations: "recomendados" } as const;
// Stable public content is refreshed on edits, with a daily safety refresh.
const catalogCache = { tags: [CACHE_TAGS.catalog], revalidate: 86400 };
// Tienda con ventana más corta: el stock baja con cada venta (el checkout igual valida stock real).
const shopCache = { tags: [CACHE_TAGS.shop], revalidate: 300 };

/* ---------------------------- Servicios ---------------------------- */

export const getServiceCatalog = unstable_cache(
  async () => {
    const [cats, rows] = await Promise.all([
      db.select().from(serviceCategories).orderBy(asc(serviceCategories.sort)),
      db
        .select()
        .from(services)
        .where(eq(services.active, true))
        .orderBy(asc(services.sort), asc(services.name)),
    ]);
    return cats.map((c) => ({ ...c, services: rows.filter((s) => s.categoryId === c.id).map(s=>({...s,name:shortServiceName(s)})) })).filter(c => c.services.length > 0);
  },
  ["service-catalog-v19"],
  catalogCache,
);

// Details and unknown URLs reuse the same catalog instead of opening a DB query per slug.
export async function getService(slug: string) {
  for (const { services: rows, ...category } of await getServiceCatalog()) {
    const service = rows.find(s => s.slug === slug);
    if (service) return { service, category };
  }
  return null;
}

export async function getActiveServiceSlugs() {
  return (await getServiceCatalog()).flatMap(c => c.services.map(s => ({ slug: s.slug })));
}

export const getQuoteVehicles = unstable_cache(
  async () => db.select().from(schema.quoteVehicles).where(eq(schema.quoteVehicles.removed, false))
    .orderBy(asc(schema.quoteVehicles.sort), asc(schema.quoteVehicles.id)),
  ["quote-vehicles-v1"],
  catalogCache,
);

export const getRecommendations = unstable_cache(
  async () => db.select().from(schema.recommendations).where(eq(schema.recommendations.active, true))
    .orderBy(desc(schema.recommendations.createdAt)),
  ["public-recommendations-v1"],
  { tags: [CACHE_TAGS.recommendations], revalidate: 86400 },
);

// Crawl traffic must not wake Postgres on every sitemap request.
export const getPublicSitemapSlugs = unstable_cache(
  async () => {
    const [serviceSlugs, productSlugs] = await Promise.all([
      db.select({ slug: services.slug }).from(services).where(eq(services.active, true)),
      db.select({ slug: products.slug }).from(products).where(eq(products.active, true)),
    ]);
    return { services: serviceSlugs, products: productSlugs };
  },
  ["public-sitemap-slugs-v1"],
  { tags: [CACHE_TAGS.catalog, CACHE_TAGS.shop], revalidate: 86400 },
);

// Solo la parte de BD va al caché: si falla lanza y no se cachea el respaldo.
const getHomeServicesFromDb = unstable_cache(
  async () => {
    const [rows, cats] = await Promise.all([
      db
        .select({ service: services, category: serviceCategories })
        .from(services)
        .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .where(and(eq(services.featured, true), eq(services.active, true)))
        .orderBy(asc(services.sort))
        .limit(3),
      db.select().from(serviceCategories).orderBy(asc(serviceCategories.sort)),
    ]);
    if (!rows.length || !cats.length) throw new Error("sin datos");
    return {
      featured: rows.map(({ service, category }) => ({
        slug: service.slug,
        categorySlug: category.slug,
        categoryName: shortCategoryName(category.slug, category.name),
        name: shortServiceName(service),
        price: service.price,
      })),
      categories: cats.map((c) => ({ slug: c.slug, name: c.name })),
    };
  },
  ["home-services-v4"],
  catalogCache,
);

/** Home: 3 servicios destacados. Si la BD falla, usa los textos del sitio original. */
export async function getHomeServices() {
  try {
    return await getHomeServicesFromDb();
  } catch (e) {
    console.warn("[home] usando respaldo estático:", (e as Error).message);
    return { featured: fallbackFeatured, categories: fallbackCategories };
  }
}

// La home original usa "Mantención" (singular) como etiqueta de la tarjeta.
function shortCategoryName(slug: string, name: string) {
  return slug === "mantenciones" ? "Mantención" : name;
}

/* ---------------------------- Tienda ---------------------------- */

export type ProductSort = "recientes" | "precio-asc" | "precio-desc";

export const getProductCategories = unstable_cache(
  async () => db.select().from(productCategories).orderBy(asc(productCategories.sort)),
  ["product-categories-v2"],
  { tags: [CACHE_TAGS.shop], revalidate: 86400 },
);

const getPublicProducts = unstable_cache(
  async () => db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.createdAt)),
  ["public-products-v1"],
  shopCache,
);

/** Search, categories, sort orders and detail URLs share one five-minute stock snapshot. */
export async function getProducts(opts: { category?: string; sort?: ProductSort } = {}) {
  const [rows, categories] = await Promise.all([getPublicProducts(), getProductCategories()]);
  const categoryId = opts.category ? categories.find(c => c.slug === opts.category)?.id : undefined;
  const filtered = rows.filter(p => !opts.category || p.categoryId === categoryId);
  if (opts.sort === "precio-asc") filtered.sort((a, b) => a.price - b.price);
  if (opts.sort === "precio-desc") filtered.sort((a, b) => b.price - a.price);
  return filtered;
}

export async function getProduct(slug: string) {
  const [rows, categories] = await Promise.all([getPublicProducts(), getProductCategories()]);
  const product = rows.find(p => p.slug === slug);
  return product ? { product, category: categories.find(c => c.id === product.categoryId) ?? null } : null;
}

export async function getFeaturedProducts(limit = 4) {
  try {
    return (await getPublicProducts()).filter(p => p.featured && p.stock > 0).slice(0, limit);
  } catch {
    return [];
  }
}

/** Checkout: siempre sin caché (precio y stock reales). */
export async function getProductsByIds(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, true)));
}
