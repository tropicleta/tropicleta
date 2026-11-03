import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { schema, type DB } from "../src/db/client";
import { persistTropibotRecord } from "../src/lib/tropibot-store";
import { saveRecordSchema } from "../src/lib/tropibot-validation";

async function main() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  const record = {requestId:randomUUID(), kind:"servicio",date:"2025-09-10",customer:"Carlos",description:"Mantención",amount:40000,paid:true,method:"Transferencia",origin:"Instagram",originDetail:""};
  try {
    await migrate(db, {migrationsFolder:"./drizzle"});
    const adapter = db as unknown as DB;
    await persistTropibotRecord(adapter,record);
    await persistTropibotRecord(adapter,record);
    assert.equal((await db.select().from(schema.cashEntries)).length,1);
    await persistTropibotRecord(adapter,{...record,requestId:randomUUID(),paid:false});
    assert.equal((await db.select().from(schema.cashEntries)).length,1);
    assert.equal((await db.select().from(schema.tropibotRecords)).length,2);
    await persistTropibotRecord(adapter,{...record,requestId:randomUUID(),kind:"gasto"});
    const cash=await db.select().from(schema.cashEntries);
    assert.equal(cash[0].area,"servicios");
    assert.equal(cash[1].type,"gasto");
    const collision=randomUUID();
    await db.insert(schema.cashEntries).values({...cash[0],id:undefined,requestId:collision});
    await assert.rejects(persistTropibotRecord(adapter,{...record,requestId:collision}));
    assert.equal((await db.select().from(schema.tropibotRecords)).length,3,"failed cash write rolls back record");
    for(const patch of [{amount:0},{amount:1.2},{date:"2099-01-01"},{origin:"inventado"}]) assert.equal(saveRecordSchema.safeParse({...record,...patch}).success,false);
    console.log("PASS Tropibot: migrations, paid/pending, duplicate retry, rollback, validation");
  } finally { await client.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
