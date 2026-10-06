import type { Service } from "@/db/schema";

function containsSlug(value: unknown, slug: string): boolean {
  if (typeof value === "string") return value === slug;
  if (Array.isArray(value)) return value.some(item=>containsSlug(item,slug));
  if (value && typeof value === "object") return Object.entries(value).some(([key,item])=>key===slug || containsSlug(item,slug));
  return false;
}

export function serviceDeletionBlocker(service: Pick<Service,"id"|"slug"|"name"|"removed">, catalog: Pick<Service,"id"|"name"|"components">[], bookings: {serviceNames:string[];quoteSnapshot:unknown}[]) {
  if (!service.removed) return "Quita primero el servicio del catálogo para enviarlo a la papelera.";
  const parents=catalog.filter(pack=>pack.id!==service.id && pack.components.some(component=>!component.recommended&&component.slug===service.slug));
  if (parents.length) return `Está vinculado a estos packs: ${parents.map(pack=>pack.name).join(", ")}. Quita sus referencias o elimina primero esos packs de la papelera.`;
  if (bookings.some(booking=>containsSlug(booking.quoteSnapshot,service.slug) || booking.serviceNames.some(name=>name===service.name || name.includes(` · ${service.name} ×`)))) return "Este servicio aparece en reservas anteriores. Consérvalo para mantener su historial; puedes recuperarlo y cambiar su URL para liberar la actual.";
  return null;
}
