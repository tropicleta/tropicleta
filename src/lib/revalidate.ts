import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/queries";

/** Tras editar servicios/productos en el panel: invalida páginas y caché de datos públicos al instante. */
export function revalidatePublicData() {
  revalidateTag(CACHE_TAGS.catalog, { expire: 0 });
  revalidateTag(CACHE_TAGS.shop, { expire: 0 });
  revalidateTag(CACHE_TAGS.recommendations, { expire: 0 });
  revalidatePath("/", "layout");
}

/**
 * Tras descontar stock. Puede correr durante el render de /checkout/gracias (sync de Mercado Pago),
 * donde Next no permite revalidar: ahí se ignora y el caché de la tienda expira solo (5 min).
 */
export function revalidateShopStock() {
  try {
    revalidateTag(CACHE_TAGS.shop, "max");
  } catch {}
}
