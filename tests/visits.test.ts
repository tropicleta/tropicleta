import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { visitSource } from "../src/lib/visit-source";

async function main() {
  assert.equal(visitSource("https://www.google.cl/search?q=private", "", "", "https://tropicleta.cl").source, "Google");
  assert.equal(visitSource("https://l.instagram.com/redirect", "", "", "https://tropicleta.cl").source, "Instagram");
  assert.equal(visitSource("https://tropicleta.cl/tienda", "", "", "https://tropicleta.cl").source, "Directo / desconocido");
  assert.deepEqual(visitSource("", "WhatsApp", "Promo verano", "https://tropicleta.cl"), { source: "whatsapp", campaign: "promo verano" });
  const db = new PGlite();
  try {
    await db.exec(readFileSync("drizzle/0022_visits.sql", "utf8"));
    for (const first of [1, 0]) await db.query(`insert into visit_daily (path,source,campaign,views,visits) values ('/','Instagram','perfil',1,$1) on conflict (day,path,source,campaign) do update set views=visit_daily.views+1, visits=visit_daily.visits+excluded.visits`, [first]);
    const result = await db.query<{ views: number; visits: number }>("select views, visits from visit_daily");
    assert.deepEqual(result.rows, [{ views: 2, visits: 1 }]);
  } finally { await db.close(); }
  console.log("Visitas: atribución, migración y acumulación correctas.");
}
void main();
