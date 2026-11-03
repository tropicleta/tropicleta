import { eq } from "drizzle-orm";
import { schema, type DB } from "@/db/client";
import { saveRecordSchema } from "./tropibot-validation";

export async function persistTropibotRecord(db: DB, input: unknown) {
  const { requestId, ...data } = saveRecordSchema.parse(input);
  return db.transaction(async tx => {
      const [record] = await tx.insert(schema.tropibotRecords).values({ requestId, data }).onConflictDoNothing().returning();
      if (!record) return null;
      if (data.paid) {
        const [cash] = await tx.insert(schema.cashEntries).values({
          requestId, date: data.date, type: data.kind === "gasto" ? "gasto" : "ingreso",
          category: data.kind === "servicio" ? "Taller" : data.kind === "venta" ? "Venta presencial" : "Otros",
          area: data.kind === "servicio" ? "servicios" : data.kind === "venta" ? "productos" : "general",
          description: `${data.customer ? data.customer + " · " : ""}${data.description}`.slice(0, 500),
          amount: data.amount, method: data.method, reference: `Tropibot #${record.id}`,
        }).returning();
        await tx.update(schema.tropibotRecords).set({ cashEntryId: cash.id }).where(eq(schema.tropibotRecords.id, record.id));
      }
      return record.id;
    });
}
