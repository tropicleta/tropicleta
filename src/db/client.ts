/**
 * Conexión a la base de datos.
 *  - Con DATABASE_URL (o POSTGRES_URL) → PostgreSQL real (node-postgres).
 *  - Sin DATABASE_URL → PGlite: Postgres embebido en ./.data/pglite (cero configuración para desarrollo/demo).
 * Sin "server-only" para poder usarse también desde scripts (seed).
 */
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { databaseUrl, isServerless } from "./url";

export type DB = NodePgDatabase<typeof schema>;

type G = { __tpDb?: DB; __tpReady?: Promise<void> };
const g = globalThis as unknown as G;

export const usingEmbeddedDb = () => !databaseUrl();

export function getDb(): DB {
  if (g.__tpDb) return g.__tpDb;
  const url = databaseUrl();
  if (url) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg") as typeof import("pg");
    g.__tpDb = drizzlePg(new Pool({
      connectionString: url,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 15_000,
    }), { schema });
  } else {
    if (isServerless()) throw new Error("Falta DATABASE_URL (o POSTGRES_URL) en las variables de entorno de Vercel.");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
    const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("node:fs") as typeof import("node:fs")).mkdirSync(dir, { recursive: true });
    g.__tpDb = drizzle(new PGlite(dir), { schema }) as unknown as DB;
  }
  return g.__tpDb;
}

/**
 * Solo modo embebido: aplica migraciones y carga el contenido demo la primera vez.
 * Se llama desde instrumentation.ts al iniciar el servidor.
 */
export function ensureEmbeddedDb(): Promise<void> {
  if (!usingEmbeddedDb()) return Promise.resolve();
  g.__tpReady ??= (async () => {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const db = getDb();
    await migrate(db as never, { migrationsFolder: "./drizzle" });
    const { seedDatabase } = await import("./seed-data");
    const [{ n }] = (await db.execute<{ n: number }>(sql`select count(*)::int as n from service_categories`)).rows;
    if (n === 0) {
      console.info("[db] PGlite vacío → cargando contenido demo");
      await seedDatabase(db, { demo: true });
    }
  })();
  return g.__tpReady;
}

export { schema };
