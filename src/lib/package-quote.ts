import type { QuoteService } from "./service-quote";
export const vehicleLabels: Record<string,string> = { bicicleta: "Bicicleta", electrica: "Bicicleta eléctrica", scooter: "Scooter eléctrico" };
export type Vehicle = string;
export type QuoteVehicle = { slug: string; name: string };
// Recommended extras share the existing JSON storage but never enter composition or pricing.
export type Component = { slug: string; required: boolean; recommended?: boolean };
export function pricingCatalog<T extends {components: Component[]}>(catalog:T[]):T[] {
  return catalog.map(s=>({...s,components:s.components.filter(c=>!c.recommended)}));
}
export type PackageService = QuoteService & { kind: string; components: Component[]; vehicles: Vehicle[]; individuallySelectable: boolean; active: boolean; removed?: boolean; requiresDoubleSuspension?: boolean; excludesDoubleSuspension?: boolean };
export function supportsVehicle(s: PackageService, vehicle: Vehicle, doubleSuspension = false) {
  return s.vehicles.includes(vehicle) && (!s.requiresDoubleSuspension || (vehicle === "scooter" || doubleSuspension)) && (!doubleSuspension || !s.excludesDoubleSuspension);
}
export type Selection = { manual: string[]; packages: string[]; excluded: string[]; quantities?: Record<string,number> };
export const emptySelection: Selection = { manual: [], packages: [], excluded: [] };

export function validateHierarchy(catalog: PackageService[]) {
  catalog = pricingCatalog(catalog);
  const map = new Map(catalog.map(s => [s.slug, s]));
  const visiting = new Set<string>(); const done = new Set<string>();
  function visit(s: PackageService) {
    if (visiting.has(s.slug)) throw Error("La composición contiene una dependencia circular.");
    if (done.has(s.slug)) return;
    if (!s.vehicles.length) throw Error("Selecciona al menos un tipo de vehículo.");
    if (s.requiresDoubleSuspension && s.excludesDoubleSuspension) throw Error("Selecciona una compatibilidad válida para la doble suspensión.");
    if (s.kind !== "package" && s.components.some(c => !c.required)) throw Error("Los trabajos incluidos en un servicio individual deben ser obligatorios.");
    if (new Set(s.components.map(c => c.slug)).size !== s.components.length) throw Error("Hay componentes duplicados.");
    visiting.add(s.slug);
    for (const c of s.components) {
      const child = map.get(c.slug);
      if (!child) throw Error("Un componente ya no existe.");
      if (child.removed) throw Error("Un componente fue quitado del catálogo.");
      if (child.requiresDoubleSuspension && !s.requiresDoubleSuspension && s.vehicles.some(v=>v!=="scooter")) throw Error("El paquete debe limitarse a bicicletas de doble suspensión.");
      if (s.active && !child.active) throw Error("Un paquete activo contiene un componente desactivado.");
      if (s.vehicles.some(v => !child.vehicles.includes(v))) throw Error("Un componente no es compatible con todos los vehículos del paquete.");
      if (child.excludesDoubleSuspension && !s.excludesDoubleSuspension && s.vehicles.some(v => v !== "scooter")) throw Error("Un componente no está disponible para bicicletas de doble suspensión.");
      if (child.kind === "package" && !child.components.length) throw Error("Define la composición del paquete incluido antes de usarlo como componente.");
      visit(child);
    }
    if (s.components.length && !s.components.some(c => c.required)) throw Error("El paquete necesita al menos un componente obligatorio.");
    visiting.delete(s.slug); done.add(s.slug);
  }
  catalog.filter(s => !s.removed).forEach(visit);
}

export function packageLeaves(catalog: PackageService[], slug: string, requiredOnly = false): string[] {
  catalog = pricingCatalog(catalog);
  const map = new Map(catalog.map(s => [s.slug, s])); const result = new Set<string>();
  const path = new Set<string>();
  function visit(key: string) {
    if (path.has(key)) throw Error("Dependencia circular.");
    const s = map.get(key); if (!s) throw Error("Componente inexistente.");
    if (s.kind !== "package") result.add(key);
    if (!s.components.length) { result.add(key); return; }
    path.add(key);
    s.components.filter(c => !requiredOnly || c.required).forEach(c => visit(c.slug));
    path.delete(key);
  }
  visit(slug); return [...result].sort();
}
export function selectedLeaves(catalog: PackageService[], selection: Selection) {
  const manual = selection.manual.filter(slug => !selection.excluded.includes(slug));
  const included = manual.flatMap(slug => packageLeaves(catalog, slug));
  const leaves = [...new Set([...included, ...selection.packages.flatMap(slug => packageLeaves(catalog, slug)).filter(slug => !selection.excluded.includes(slug))])];
  return [...new Set(leaves.flatMap(slug => catalog.find(s => s.slug === slug)?.kind !== "package" ? packageLeaves(catalog, slug) : [slug]))].sort();
}
export function includingService(catalog: PackageService[], selection: Selection, slug: string) {
  return catalog.find(s => s.kind !== "package" && s.slug !== slug && s.components.length && selectedLeaves(catalog, selection).includes(s.slug) && packageLeaves(catalog, s.slug).includes(slug));
}
/** A covered pack is an inclusion, rather than another selectable purchase. */
export function coveringPackage(catalog: PackageService[], selection: Selection, slug: string) {
  const service = catalog.find(s => s.slug === slug);
  if (!service?.components.length) return undefined;
  const required = packageLeaves(catalog, slug, true);
  const leaves = selectedLeaves(catalog, selection);
  if (!required.every(key => leaves.includes(key))) return undefined;
  return [...selection.packages,...selection.manual].map(key => catalog.find(s => s.slug === key)).find(parent => {
    if (!parent || parent.slug === slug || !parent.components.length) return false;
    const parentLeaves = packageLeaves(catalog, parent.slug);
    const contains = (key: string, seen = new Set<string>()): boolean => {
      if (seen.has(key)) return false;
      seen.add(key);
      return catalog.find(s => s.slug === key)?.components.some(c => c.slug === slug || contains(c.slug, seen)) ?? false;
    };
    return (contains(parent.slug) || parentLeaves.length > packageLeaves(catalog, slug).length) && required.every(key => parentLeaves.includes(key));
  });
}
export function toggleSelection(catalog: PackageService[], selection: Selection, slug: string): Selection {
  const service = catalog.find(s => s.slug === slug); if (!service) return selection;
  if (includingService(catalog, selection, slug)) return selection;
  if (service.kind === "package") {
    const all = packageLeaves(catalog, slug);
    if (selection.packages.includes(slug) && packageLeaves(catalog,slug,true).every(s=>selectedLeaves(catalog,selection).includes(s))) return { ...selection, packages: selection.packages.filter(p => p !== slug) };
    return { ...selection, packages: [...new Set([...selection.packages, slug])], excluded: selection.excluded.filter(p => !all.includes(p)) };
  }
  const checked = selectedLeaves(catalog, selection).includes(slug);
  return checked ? { ...selection, manual: selection.manual.filter(s => s !== slug), excluded: [...new Set([...selection.excluded, slug])] }
    : { ...selection, manual: [...new Set([...selection.manual, slug])], excluded: selection.excluded.filter(s => s !== slug) };
}

/** Exact cover: each selected work belongs to precisely one charged line. */
export function packageQuote(catalog: PackageService[], selection: Selection, vehicle: Vehicle, doubleSuspension = false) {
  catalog = pricingCatalog(catalog);
  validateHierarchy(catalog);
  const map = new Map(catalog.map(s => [s.slug, s]));
  const allowed = catalog.filter(s => s.active && !s.removed && supportsVehicle(s, vehicle, doubleSuspension));
  for (const slug of [...selection.manual, ...selection.packages, ...selection.excluded]) {
    const s = map.get(slug);
    if (!s || !s.active || s.removed || !supportsVehicle(s, vehicle, doubleSuspension)) throw Error("La selección contiene un servicio no disponible para este vehículo.");
  }
  if (selection.manual.some(slug => map.get(slug)!.kind === "package" || !map.get(slug)!.individuallySelectable)) throw Error("Este trabajo solo se puede seleccionar dentro de un paquete.");
  if (selection.packages.some(slug => !map.get(slug)!.individuallySelectable)) throw Error("Este paquete solo se puede contratar dentro de otro paquete.");
  if (selection.packages.some(slug => map.get(slug)!.kind !== "package")) throw Error("La selección de paquetes no es válida.");
  const leaves = selectedLeaves(catalog, selection);
  if (leaves.length > 40) throw Error("Selecciona hasta 40 trabajos por cotización.");
  const opaque = leaves.filter(slug => map.get(slug)!.kind === "package");
  if (opaque.length && leaves.length > 1) throw Error("Este paquete tiene su composición pendiente. Cotízalo por separado para evitar cobros duplicados.");
  const recognized = allowed.filter(s => s.kind === "package" && s.components.length && packageLeaves(catalog, s.slug, true).every(slug => leaves.includes(slug)));
  const bit = new Map(leaves.map((slug,i) => [slug, 1n << BigInt(i)]));
  const candidates = [...leaves.map(slug => ({ service: map.get(slug)!, included: [slug] })), ...recognized.map(service => ({ service, included: packageLeaves(catalog, service.slug).filter(slug => leaves.includes(slug)) }))]
    .map(c => c.service.kind !== "package" && c.service.components.length ? {...c, included: packageLeaves(catalog, c.service.slug)} : c)
    .map(c => ({ ...c, mask: c.included.reduce((mask, slug) => mask | bit.get(slug)!, 0n) }))
    .sort((a,b) => a.service.slug.localeCompare(b.service.slug));
  type Plan = { cost: number; pending: number; lines: typeof candidates };
  const memo = new Map<bigint, Plan | null>(); let states = 0;
  function solve(remaining: bigint): Plan | null {
    if (!remaining) return { cost: 0, pending: 0, lines: [] };
    if (memo.has(remaining)) return memo.get(remaining)!;
    if (++states > 100000) throw Error("Esta composición tiene demasiadas combinaciones. Simplifica los paquetes.");
    const first = remaining & -remaining; let best: Plan | null = null;
    for (const c of candidates) {
      const individualInclusions = c.service.kind !== "package" && c.service.components.length > 0;
      const effective = c.mask & remaining;
      if (!(effective & first) || (individualInclusions ? !(remaining & bit.get(c.service.slug)!) : effective !== c.mask)) continue;
      const next = solve(remaining ^ effective); if (!next) continue;
      const plan = { cost: next.cost + (c.service.price ?? 0), pending: next.pending + (c.service.price === null ? 1 : 0), lines: [c, ...next.lines] };
      if (!best || plan.pending < best.pending || (plan.pending === best.pending && (plan.cost < best.cost || (plan.cost === best.cost && plan.lines.length < best.lines.length)))) best = plan;
    }
    memo.set(remaining, best); return best;
  }
  const result = solve((1n << BigInt(leaves.length)) - 1n);
  if (!result) throw Error("No se puede calcular esta combinación sin duplicar trabajos.");
  return { leaves, recognized: recognized.map(s => s.slug), lines: result.lines.map(c => ({ ...c.service, included: c.included.filter(s => s !== c.service.slug), automatic: c.service.kind === "package" && !selection.packages.includes(c.service.slug) })) };
}
