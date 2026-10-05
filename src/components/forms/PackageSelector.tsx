"use client";


import Link from "next/link";
import { formatCLP } from "@/lib/format";
import { matchesSearch } from "@/lib/catalog-search";
import { includingService, coveringPackage, packageLeaves, selectedLeaves, supportsVehicle, type QuoteVehicle, type Vehicle, type PackageService, type Selection } from "@/lib/package-quote";
import { packageReference } from "@/lib/package-reference";
export type PackageCatalog = { slug:string; name:string; services:(PackageService & { summary?:string|null })[] }[];
export function PackageSelector({catalog,selection,vehicle,doubleSuspension,vehicles,query,covered,onToggle,onVehicle,onQuery}: {catalog:PackageCatalog;selection:Selection;vehicle:Vehicle;doubleSuspension:boolean;vehicles:QuoteVehicle[];query:string;covered:string[];onToggle:(slug:string)=>void;onVehicle:(v:Vehicle,doubleSuspension:boolean)=>void;onQuery:(q:string)=>void}) {
  const all=catalog.flatMap(c=>c.services); const leaves=selectedLeaves(all,selection);
  const packages=all.filter(s=>s.kind === "package" && s.individuallySelectable && supportsVehicle(s,vehicle,doubleSuspension));
  const included=new Set([...selection.packages,...selection.manual].flatMap(slug=>packageLeaves(all,slug)));
  const price=(s:PackageService)=>s.price===null?"A cotizar":(s.priceFrom?"Desde ":"")+formatCLP(s.price);
  return <fieldset className="tp-fieldset"><legend className="tp-label">1. Arma tu cotización</legend>
    <div className="tp-options tp-options-2">{vehicles.map(option=><label key={option.slug} className="tp-option"><input type="radio" name="vehicleType" value={option.slug} checked={vehicle===option.slug} onChange={()=>onVehicle(option.slug,false)}/><span>{option.name}</span></label>)}</div>
    {!vehicles.length && <p className="tp-alert">No hay vehículos disponibles para cotizar en este momento.</p>}
    {packages.length>0 && <div><h2 className="tp-quote-heading">Paquetes de servicios</h2><div className="tp-package-grid">{packages.map(s=>{const parent=coveringPackage(all,selection,s.slug);const chosen=selection.packages.includes(s.slug);const ref=packageReference(all,s);return <div key={s.slug} className={"tp-package-option"+(parent?" is-included":chosen?" is-selected":"")}><label className="tp-option">{!parent&&<input type="checkbox" checked={chosen} onChange={()=>onToggle(s.slug)} />}<span><strong>{s.name}</strong>{parent?<small className="tp-pack-inclusion" role="status">Incluido en {parent.name} · Sin cobro adicional</small>:<b>{price(s)}</b>}{!parent&&ref&&<small>Valor individual{ref.estimated?" referencial":""}: {formatCLP(ref.reference)}{ref.savings!==null&&<> · {ref.savings<0?"Diferencia":"Ahorro"}: {formatCLP(Math.abs(ref.savings))}</>}</small>}{s.summary && <small>{s.summary}</small>}<small>{s.components.length?`${packageLeaves(all,s.slug).length} trabajos incluidos`:"Composición pendiente · se cotiza por separado"}</small></span></label>{s.components.length>0&&<details className="tp-pack-details"><summary>Ver servicios incluidos</summary><ul>{packageLeaves(all,s.slug).map(slug=><li key={slug}>{all.find(c=>c.slug===slug)!.name}</li>)}</ul></details>}</div>})}</div></div>}
    <h2 className="tp-quote-heading">Servicios individuales</h2>
    <label className="tp-field">Buscar un servicio<input className="tp-input" type="search" value={query} onChange={e=>onQuery(e.target.value)} placeholder="Frenos, ruedas, suspensión…" /></label>
    <p className="tp-hint">Precios en pesos chilenos. Los trabajos cubiertos por un paquete no se cobran aparte.</p>
    {catalog.filter(c=>c.slug!=="retiro-entrega").map(c=>{const rows=c.services.filter(s=>s.kind!=="package" && supportsVehicle(s,vehicle,doubleSuspension) && (s.individuallySelectable||included.has(s.slug)) && matchesSearch(query,s.name,s.summary,c.name));return rows.length>0 && <div key={c.slug} id={c.slug}><h3 className="tp-quote-category">{c.name}</h3><div className="tp-options tp-options-2">{rows.map(s=>{const parent=includingService(all,selection,s.slug);return <div className={"tp-service-option"+(parent?" is-included":"")} key={s.slug}><label className="tp-option"><input type="checkbox" checked={leaves.includes(s.slug)} onChange={()=>onToggle(s.slug)} disabled={!!parent||(!s.individuallySelectable&&!included.has(s.slug))} /><span>{s.name}<small>{parent?`Incluido en ${parent.name} · Sin cobro adicional`:covered.includes(s.slug)?"Incluido en paquete":price(s)}</small>{s.components.length>0&&<small>Incluye: {packageLeaves(all,s.slug).filter(slug=>slug!==s.slug).map(slug=>all.find(c=>c.slug===slug)?.name).join(", ")}</small>}<Link href={`/servicios/${s.slug}/`}>Ver detalle</Link></span></label></div>})}</div></div>})}
    {!catalog.some(c=>c.services.some(s=>s.kind!=="package"&&supportsVehicle(s,vehicle,doubleSuspension)&&matchesSearch(query,s.name,s.summary,c.name))) && <p>No hay servicios con esa búsqueda para este vehículo.</p>}
  </fieldset>;
}
