import { packageLeaves, pricingCatalog, type PackageService } from "./package-quote";

/** Suma los trabajos individuales únicos a sus precios vigentes, sin usar precios de packs. */
export function packageReference(catalog: PackageService[], service: PackageService) {
  catalog=pricingCatalog(catalog);
  service={...service,components:service.components.filter(c=>!c.recommended)};
  if (service.kind !== "package" || !service.components.length) return null;
  const expanded = packageLeaves(catalog, service.slug).map(slug => catalog.find(s => s.slug === slug)!);
  const leaves = expanded.filter(s => !expanded.some(parent => parent.slug !== s.slug && parent.components.length && packageLeaves(catalog,parent.slug).includes(s.slug)));
  if (leaves.some(s => s.price === null)) return null;
  const reference = leaves.reduce((total, s) => total + s.price!, 0);
  return { reference, savings: service.price === null ? null : reference - service.price, ...(service.priceFrom || leaves.some(s=>s.priceFrom)?{estimated:true}:{}) };
}
