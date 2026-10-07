import "server-only";
import { site } from "@/data/site";
import { faqs } from "@/data/faq";
import { posts } from "@/data/posts";
import { shopRules } from "@/data/shop";
import { formatCLP } from "@/lib/format";
import { getProducts, getServiceCatalog } from "@/lib/queries";

/**
 * Conocimiento del asistente, armado con datos reales del sitio (servicios y tienda desde la BD, cacheados
 * por las mismas etiquetas que usa el sitio). Si la BD falla, el asistente sigue funcionando con lo estático.
 */
export async function buildKnowledge(): Promise<string> {
  const parts: string[] = [];

  parts.push(`NEGOCIO
- ${site.name}: taller de bicicletas (y scooters eléctricos) en ${site.location}. ${site.addressNote}
- Cobertura: ${site.coverage.join(", ")}. Atención siempre con coordinación previa.
- WhatsApp: ${site.whatsappDisplay} (https://wa.me/${site.whatsappNumber}). Email: ${site.email}.
- Diagnóstico gratis y presupuesto antes de cualquier trabajo. Garantía de 2 semanas en mano de obra.
- Los precios publicados son de mano de obra; los repuestos se cotizan aparte.
- Páginas útiles: /agendar/ (solicitar hora), /servicios/, /tienda/, /eventos/ (taller móvil para eventos),
  /consejos/, /preguntas-frecuentes/, /garantia/, /envios-y-devoluciones/, /mi-orden/ (seguimiento de compra), /contacto/.`);

  try {
    const catalog = await getServiceCatalog();
    const lines = catalog.flatMap((c) =>
      c.services.map((s) => {
        const price = s.price == null ? "a cotizar" : `${s.priceFrom ? "desde " : ""}${formatCLP(s.price)}`;
        const extra = [s.duration && `duración ${s.duration}`, s.summary].filter(Boolean).join(" · ");
        return `- [${c.name}] ${s.name}: ${price}${extra ? ` · ${extra}` : ""} → /servicios/${s.slug}/`;
      }),
    );
    if (lines.length) parts.push(`SERVICIOS DEL TALLER\n${lines.join("\n")}`);
  } catch (e) {
    console.warn("[chat] sin catálogo de servicios:", (e as Error).message);
  }

  try {
    const items = await getProducts({});
    const lines = items.slice(0, 40).map((p) => {
      const stock = p.stock > 0 ? "disponible" : "sin stock";
      return `- ${p.name}: ${formatCLP(p.price)} (${stock}) → /tienda/${p.slug}/`;
    });
    if (lines.length) parts.push(`TIENDA\n${lines.join("\n")}`);
  } catch (e) {
    console.warn("[chat] sin productos:", (e as Error).message);
  }

  const shipping = Object.entries(shopRules.shippingByCommune)
    .map(([commune, cost]) => `${commune} ${formatCLP(cost)}`)
    .join(", ");
  parts.push(`COMPRAS
- Pago con Mercado Pago. Retiro gratis en el taller o despacho: ${shipping}.`);

  parts.push(`PREGUNTAS FRECUENTES\n${faqs.map((f) => `- ${f.q} ${f.a}`).join("\n")}`);
  parts.push(`CONSEJOS PUBLICADOS\n${posts.map((p) => `- ${p.title} → /consejos/${p.slug}/`).join("\n")}`);

  return parts.join("\n\n");
}
