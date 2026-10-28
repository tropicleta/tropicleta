/** Preparación de PostgreSQL durante el despliegue; nunca carga ventas o productos de ejemplo. */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "./schema";
import { databaseUrl } from "./url";
import { completeCatalog } from "./catalog";
import { addRequestedShockFramePack, updateRequestedBrakePacks, retireRequestedFullMaintenancePack, renameRequestedBrakePack, addRequestedWheelTubelessPack } from "./requested-packs";

async function main() {
  const url = databaseUrl();
  if (!url) throw new Error("Configura DATABASE_URL (o POSTGRES_URL) en Vercel para este entorno (Production/Preview) antes de publicar.");
  const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15000 });
  try {
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    const added = await completeCatalog(db);
    const packs = await addRequestedShockFramePack(db);
    const brakePacks = await updateRequestedBrakePacks(db);
    await retireRequestedFullMaintenancePack(db);
    await renameRequestedBrakePack(db);
    await addRequestedWheelTubelessPack(db);
    console.log(`Packs de frenos: ${brakePacks} agregados; actualización revisada.`);
    console.log(`Packs solicitados: ${packs} agregados.`);
    console.log(`Catálogo: ${added.services} servicios y ${added.drafts} borradores de productos agregados.`);
    console.log("Base de datos preparada; datos existentes conservados.");
  } finally {
    await pool.end();
  }
}

// Log completo: los errores de conexión de pg (AggregateError, SSL, DNS) suelen venir con `message` vacío
main().catch((error) => {
  const host = (() => { try { return new URL(databaseUrl() ?? "").host; } catch { return "(DATABASE_URL inválida)"; } })();
  console.error(`[deploy] Falló la preparación de la BD (host: ${host})`);
  console.error(error);
  for (const e of error?.errors ?? []) console.error("  ↳", e?.code ?? "", e?.message ?? e);
  process.exitCode = 1;
});
