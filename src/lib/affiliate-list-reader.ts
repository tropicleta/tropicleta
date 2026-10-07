import "server-only";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const affiliateListUrl = "https://www.mercadolibre.cl/social/tropicleta/lists/29d0cd7a-cea5-4da9-b610-0435b82391b6?matt_tool=38636572";

export type PublicAffiliateItem = {
  sourceKey: string;
  name: string;
  url: string;
  imageUrl: string | null;
  price: number;
};

/** Navegador del servidor sin sesión; solo página pública. Rechazos no son listas vacías. */
export async function readPublicAffiliateList() {
  if (process.platform !== "linux") throw new Error("El lector se comprueba en el servidor Linux de Vercel.");
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const started = Date.now();
  try {
    const page = await browser.newPage();
    const items = new Map<string, PublicAffiliateItem>();
    const visited = new Set<string>();
    let next: string | null = affiliateListUrl;
    let pages = 0;
    while (next) {
      if (pages >= 30 || Date.now() - started > 180000 || visited.has(next)) throw new Error("La lectura no pudo completarse. No se aplicaron cambios.");
      visited.add(next);
      const target = new URL(next);
      if (target.hostname !== "www.mercadolibre.cl" || target.pathname !== new URL(affiliateListUrl).pathname) throw new Error("La página cambió de destino. No se aplicaron cambios.");
      const response = await page.goto(next, { waitUntil: "domcontentloaded", timeout: 25000 });
      if (!response?.ok()) throw new Error(`Mercado Libre rechazó la lectura (HTTP ${response?.status() ?? "sin respuesta"}).`);
      await page.waitForSelector(".lists-card .poly-component__title", { timeout: 12000 });
      const result = await page.evaluate(() => {
        const heading = document.querySelector("h1")?.textContent?.trim();
        const cards = [...document.querySelectorAll(".lists-card")].map(card => {
          const link = card.querySelector<HTMLAnchorElement>("a.poly-component__title");
          const img = card.querySelector<HTMLImageElement>("img.poly-component__picture");
          const price = card.querySelector(".poly-price__current .andes-money-amount__fraction")?.textContent;
          const amount = price ? Number(price.replace(/\./g, "")) : 0;
          return { name: link?.textContent?.trim() ?? "", url: link?.href ?? "", imageUrl: img?.getAttribute("src") ?? img?.getAttribute("data-src") ?? null, price: amount };
        });
        const forward = [...document.querySelectorAll<HTMLAnchorElement>("a")].find(a => a.textContent?.trim() === "Siguiente");
        const disabled = forward?.getAttribute("aria-disabled") === "true" || forward?.closest('[aria-disabled="true"]');
        return { heading, cards, next: !disabled ? forward?.href ?? null : null };
      });
      if (result.heading !== "Mis recomendaciones" || !result.cards.length) throw new Error("No se reconoció una lista completa. No se aplicaron cambios.");
      for (const item of result.cards) {
        const url = new URL(item.url);
        if (url.protocol !== "https:" || !(url.hostname === "mercadolibre.cl" || url.hostname.endsWith(".mercadolibre.cl")) || !item.name || !Number.isSafeInteger(item.price) || item.price <= 0) {
          throw new Error("Un producto no pudo leerse correctamente. No se aplicaron cambios.");
        }
        // Clave del destino público: no confundir ficha de catálogo y publicación.
        const sourceKey = url.pathname.match(/\/(p|up)\/(MLCU?\d+)/)?.slice(1).join(":") ?? url.pathname.match(/MLC-\d+/)?.[0];
        if (!sourceKey || items.has(sourceKey)) throw new Error("Identificador ausente o duplicado. Revisa la lista antes de sincronizar.");
        if (item.imageUrl && new URL(item.imageUrl).hostname !== "http2.mlstatic.com") item.imageUrl = null;
        items.set(sourceKey, { ...item, sourceKey });
      }
      pages++;
      next = result.next;
    }
    return { complete: true as const, pages, checkedAt: new Date().toISOString(), items: [...items.values()] };
  } finally {
    await browser.close();
  }
}
