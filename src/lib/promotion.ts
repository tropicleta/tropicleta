import { z } from "zod";

export const promotionCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/, "Usa entre 3 y 32 letras, números, guiones o guiones bajos.");
export function promotionIsValid(promotion: { active: boolean; expiresOn: string | null }, today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" })) {
  return promotion.active && (!promotion.expiresOn || promotion.expiresOn >= today);
}
export function applyPromotion<T extends { subtotal: number; discount: number; total: number }>(quote: T, promotion: { code: string; percent: number } | null) {
  const promotionalDiscount = promotion ? Math.round(quote.subtotal * promotion.percent / 100) : 0;
  const discount = Math.max(quote.discount, promotionalDiscount);
  return { ...quote, discount, total: quote.total + quote.discount - discount, promotion: promotion ? { ...promotion, discount: promotionalDiscount, applied: promotionalDiscount >= quote.discount } : null };
}
