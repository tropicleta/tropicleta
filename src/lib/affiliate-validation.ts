import { z } from "zod";

export function isMercadoLibreUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      (url.hostname === "mercadolibre.cl" || url.hostname.endsWith(".mercadolibre.cl") || url.hostname === "meli.la");
  } catch { return false; }
}

export const recommendationSchema = z.object({
  name: z.string().trim().min(3, "Escribe un nombre de al menos 3 caracteres.").max(140),
  category: z.string().trim().min(2).max(60),
  reason: z.string().trim().min(15, "Explica en al menos 15 caracteres por qué lo recomiendas.").max(1200),
  url: z.string().trim().max(2000).refine(isMercadoLibreUrl, "Usa un enlace HTTPS de Mercado Libre Chile o meli.la."),
  active: z.boolean(),
  imageUrl: z.string().trim().max(2000).nullable().optional().refine(value => {
    if (!value) return true;
    try { const url = new URL(value); return url.protocol === "https:" && url.hostname === "http2.mlstatic.com" && !url.username && !url.password; }
    catch { return false; }
  }, "Usa la URL HTTPS de la foto de Mercado Libre (http2.mlstatic.com)."),
  price: z.number().int().positive().max(2147483647).nullable().optional(),
});
