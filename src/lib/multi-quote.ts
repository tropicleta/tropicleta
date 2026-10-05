import { z } from "zod";
import { selectionSchema } from "./quote-selection";
import { packageLeaves, packageQuote, selectedLeaves, toggleSelection, type PackageService, type QuoteVehicle, type Selection } from "./package-quote";

export const vehicleQuotesSchema=z.array(z.object({id:z.string().min(1).max(60),vehicle:z.string().min(1).max(20),details:z.string().max(200),selection:selectionSchema})).min(1).max(10).refine(rows=>new Set(rows.map(r=>r.id)).size===rows.length,"Hay vehículos duplicados.");
export type VehicleQuote=z.infer<typeof vehicleQuotesSchema>[number];
export function selectionQuantities(catalog:PackageService[],selection:Selection){
  const counts:Record<string,number>={};
  for(const slug of selectedLeaves(catalog,selection)){
    counts[slug]=Math.max(...[...selection.manual,...selection.packages].filter(p=>packageLeaves(catalog,p).includes(slug)).map(p=>selection.quantities?.[p]??1),0);
    if(selection.quantities?.[slug])counts[slug]=selection.quantities[slug];
  }
  return counts;
}
export function setSelectionQuantity(catalog:PackageService[],selection:Selection,slug:string,quantity:number):Selection{
  if(!Number.isInteger(quantity)||quantity<0||quantity>1)return selection;
  const service=catalog.find(s=>s.slug===slug);if(!service)return selection;
  const selected=service.kind==="package"?selection.packages.includes(slug):selectedLeaves(catalog,selection).includes(slug);
  let next=selection;
  if(service.kind==="package"&&!selected&&service.components.length&&packageLeaves(catalog,slug,true).every(s=>selectedLeaves(catalog,selection).includes(s))){
    const leaves=packageLeaves(catalog,slug);
    next={...selection,manual:selection.manual.filter(s=>!leaves.includes(s)),quantities:Object.fromEntries(Object.entries(selection.quantities??{}).filter(([s])=>!leaves.includes(s)))};
    if(quantity===0)return cleanSelectionQuantities(catalog,{...next,excluded:[...new Set([...next.excluded,...leaves])]});
  }
  if(quantity===0){if(selected)next=service.kind==="package"?{...next,packages:next.packages.filter(p=>p!==slug)}:toggleSelection(catalog,next,slug);}
  else if(!selected)next=toggleSelection(catalog,next,slug);
  const quantities={...next.quantities};
  if(quantity===0)delete quantities[slug];else quantities[slug]=quantity;
  return cleanSelectionQuantities(catalog,{...next,quantities});
}
export function cleanSelectionQuantities(catalog:PackageService[],selection:Selection):Selection{
  const selected=new Set([...selectedLeaves(catalog,selection),...selection.packages]);
  return {...selection,quantities:Object.fromEntries(Object.entries(selection.quantities??{}).filter(([slug])=>selected.has(slug)))};
}
export function quantityPackageQuote(catalog:PackageService[],raw:Selection,vehicle:string){
  const selection=selectionSchema.parse(raw);
  // Validate the original selection before any expansion or optimization.
  const original=packageQuote(catalog,selection,vehicle);
  const counts=selectionQuantities(catalog,selection);
  if(Object.values(counts).reduce((a,b)=>a+b,0)>200)throw Error("Selecciona hasta 200 trabajos por vehículo.");
  for(const [slug] of Object.entries(selection.quantities??{})){
    if(!original.leaves.includes(slug)&&!selection.packages.includes(slug))throw Error("Hay una cantidad para un servicio que no está seleccionado.");
  }
  type Line=typeof original.lines[number]&{quantity:number;includedQuantities:Record<string,number>};
  const lines:Line[]=[];
  for(let layer=0;layer<Math.max(0,...Object.values(counts));layer++){
    const packages=selection.packages.filter(p=>(selection.quantities?.[p]??1)>layer);
    const included=new Set(packages.flatMap(p=>packageLeaves(catalog,p)));
    const manual=Object.keys(counts).filter(slug=>counts[slug]>layer&&!included.has(slug)&&catalog.find(s=>s.slug===slug)?.kind!=="package");
    const excluded=[...new Set([...selection.excluded,...Object.keys(counts).filter(slug=>counts[slug]<=layer)])];
    const current=packageQuote(catalog,{manual,packages,excluded},vehicle);
    for(const line of current.lines){
      const existing=lines.find(l=>l.slug===line.slug);
      if(existing){existing.quantity++;existing.included=[...new Set([...existing.included,...line.included])];for(const slug of line.included)existing.includedQuantities[slug]=(existing.includedQuantities[slug]??0)+1;}
      else lines.push({...line,quantity:1,includedQuantities:Object.fromEntries(line.included.map(slug=>[slug,1]))});
    }
  }
  return {...original,counts,lines};
}
export function multiVehicleQuote(catalog:PackageService[],raw:VehicleQuote[],vehicles:QuoteVehicle[]){
  const rows=vehicleQuotesSchema.parse(raw);
  return rows.map((row,index)=>{
    const vehicle=vehicles.find(v=>v.slug===row.vehicle);if(!vehicle)throw Error("Un vehículo ya no está disponible. Revisa la cotización.");
    const calculation=quantityPackageQuote(catalog,row.selection,row.vehicle);
    return {...row,label:`${vehicle.name} ${index+1}`,calculation};
  });
}
