import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { promotionCodeSchema, promotionIsValid } from "./promotion";

export async function findPromotion(input: string) {
  const code = promotionCodeSchema.safeParse(input);
  if (!code.success) return null;
  const [promotion] = await db.select().from(schema.promotions).where(eq(schema.promotions.code, code.data)).limit(1);
  return promotion && promotionIsValid(promotion) ? { code: promotion.code, percent: promotion.percent } : null;
}
