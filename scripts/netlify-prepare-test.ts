import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../src/db/schema";
import { seedDatabase } from "../src/db/seed-data";

async function main() {
  const url = new URL(process.env.NETLIFY_TEST_DATABASE_URL ?? "");
  if (url.pathname !== "/tropicleta_netlify_test" || url.hostname.includes("-pooler"))
    throw new Error("Requires direct connection to the dedicated tropicleta_netlify_test database.");
  const pool = new Pool({ connectionString: url.href, max: 1, connectionTimeoutMillis: 15000, statement_timeout: 30000 });
  try {
    const check = await pool.query("select current_database() as name, (select count(*)::int from information_schema.tables where table_schema='public') as tables");
    if (check.rows[0].name !== "tropicleta_netlify_test" || check.rows[0].tables !== 0)
      throw new Error("Refusing to seed an existing or incorrect database.");
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    await seedDatabase(db, { demo: false });
    console.info("Dedicated test schema and fictitious catalog prepared. No customers or orders copied.");
  } finally { await pool.end(); }
}
main().catch(() => { console.error("Test database setup failed; inspect without exposing connection credentials."); process.exitCode = 1; });
