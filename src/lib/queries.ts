import "server-only";
import { shortServiceName } from "./service-visuals";
import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/db";
import { fallbackCategories, fallbackFeatured } from "@/data/services-fallback";

const { services, serviceCategories, products, productCategories } = schema;

/**
 * Caché de datos públicos (Data Cache de Next): las páginas siguen siendo dinámicas, pero no consultan la BD
 * en cada visita. Se invalida por tag desde el panel (`revalidatePublicData`) y al descontar stock.
 * Ojo: el caché serializa a JSON, así que los `Date` (products.createdAt) vuelven como string; no se usan en el sitio.
 */
export const CACHE_TAGS = { catalog: "catalogo", shop: "tienda" } as const;
const catalogCache = { tags: [CACHE_TAGS.catalog], revalidate: 3600 };
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
  ["service-catalog-v11"],
  catalogCache,
);

export const getService = unstable_cache(
  async (slug: string) => {
    const rows = await db
      .select({ service: services, category: serviceCategories })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(eq(services.slug, slug), eq(services.active, true)))
      .limit(1);
    return rows[0] ? {...rows[0],service:{...rows[0].service,name:shortServiceName(rows[0].service)}} : null;
  },
  ["service-v11"],
  catalogCache,
);

export async function getActiveServiceSlugs() {
  return db.select({ slug: services.slug }).from(services).where(eq(services.active, true));
}

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
  shopCache,
);

export const getProducts = unstable_cache(
  async (opts: { category?: string; sort?: ProductSort } = {}) => {
    const order =
      opts.sort === "precio-asc"
        ? asc(products.price)
        : opts.sort === "precio-desc"
          ? desc(products.price)
          : desc(products.createdAt);

    if (!opts.category) {
      return db.select().from(products).where(eq(products.active, true)).orderBy(order);
    }
    // Filtro por categoría en una sola consulta (join por slug)
    const rows = await db
      .select({ product: products })
      .from(products)
      .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(and(eq(products.active, true), eq(productCategories.slug, opts.category)))
      .orderBy(order);
    return rows.map((r) => r.product);
  },
  ["products"],
  shopCache,
);

export const getProduct = unstable_cache(
  async (slug: string) => {
    const rows = await db
      .select({ product: products, category: productCategories })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(and(eq(products.slug, slug), eq(products.active, true)))
      .limit(1);
    return rows[0] ?? null;
  },
  ["product"],
  shopCache,
);

const getFeaturedProductsFromDb = unstable_cache(
  async (limit: number) =>
    db
      .select()
      .from(products)
      .where(and(eq(products.featured, true), eq(products.active, true), gt(products.stock, 0)))
      .orderBy(desc(products.createdAt))
      .limit(limit),
  ["featured-products"],
  shopCache,
);

export async function getFeaturedProducts(limit = 4) {
  try {
    return await getFeaturedProductsFromDb(limit);
  } catch {
    return [];
  }
}

/** Checkout: siempre sin caché (precio y stock reales). */
export async function getProductsByIds(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, true)));
}
