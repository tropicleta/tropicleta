import { packageReference } from "./package-reference";
import { packageLeaves, supportsVehicle, type PackageService } from "./package-quote";
import { formatCLP } from "./format";
import { serviceQuote, transportLabels, type TransportMode } from "./service-quote";

type Line = PackageService & {quantity?:number};
type Group = {label:string;details?:string;calculation:{lines:Line[];leaves:string[]}};

export function quoteSavings(catalog:PackageService[], lines:Line[]) {
  let savings=0, estimated=false, incomplete=false;
  for(const line of lines){
    if(line.kind!=="package")continue;
    const reference=packageReference(catalog,line);
    // A customized pack may no longer include every original job: don't claim its full saving.
    if(!reference || !packageLeaves(catalog,line.slug).every(slug=>!("included" in line)|| (line as Line & {included:string[]}).included.includes(slug))){incomplete=true;continue;}
    if(reference.savings!==null) savings+=reference.savings*(line.quantity??1);
    else incomplete=true;
    estimated ||= !!reference.estimated;
  }
  return {savings,estimated,incomplete};
}

export function quoteMessage(catalog:PackageService[],groups:Group[],pickup:boolean,commune:string,mode:TransportMode,firstService:boolean){
  const lines=groups.flatMap(g=>g.calculation.lines);
  const quote=serviceQuote(lines,pickup,commune,mode,firstService);
  const savings=quoteSavings(catalog,lines);
  return ["Hola Tropicleta, quiero solicitar esta cotización:","",
    ...groups.flatMap(g=>[`${g.label}${g.details?` · ${g.details}`:""}`,
      ...g.calculation.lines.map(s=>`• ${s.name}: ${s.price===null?"A cotizar":`${s.priceFrom?"Desde ":""}${formatCLP(s.price*(s.quantity??1))}`}`),""]),
    ...(savings.savings>0?[`Ahorro en packs${savings.estimated?" referencial":""}: ${formatCLP(savings.savings)} (ya incluido en los precios)`]:[]),
    `Subtotal de servicios: ${formatCLP(quote.subtotal)}`,
    ...(firstService?[`Descuento primer servicio (10%): −${formatCLP(quote.discount)}`]:[]),
    ...(pickup?[`${transportLabels[mode]} · ${commune||"zona por definir"}: ${quote.transport===null?"A cotizar":formatCLP(quote.transport)}`]:[]),
    `TOTAL ESTIMADO${quote.from?" DESDE":""}: ${formatCLP(quote.total)}`,
    ...(quote.pending?["Hay valores pendientes de cotizar; no están incluidos en el total."]:[]),
    "","Sujeto a diagnóstico y confirmación del taller."].join("\n");
}

export function suggestedExtras(catalog:PackageService[],parents:string[],leaves:string[],vehicle:string){
  if(!parents.length)return [];
  const configured=[...new Set(parents.flatMap(slug=>catalog.find(s=>s.slug===slug)?.components.filter(c=>c.recommended).map(c=>c.slug)??[]))];
  // When no specific recommendations have been configured, offer compatible workshop jobs.
  const defaults=["servicio-basico-horquilla","purga-frenos-hidraulicos","sangrado-freno-trasero","limpieza-bicicleta-transmision","limpieza-ultrasonica-encerado","pinchazo-scooter","cambio-de-camara-delantera-scooter","cambio-de-camara-trasera-scooter","frenos-scooter","frenos-scooter-delantero","frenos-scooter-trasero","recarga-liquido"];
  const slugs=configured.length?configured:defaults;
  return slugs.map(slug=>catalog.find(s=>s.slug===slug)).filter((s):s is PackageService=>!!s&&s.active&&!s.removed&&s.kind!=="package"&&s.individuallySelectable&&supportsVehicle(s,vehicle)&&!leaves.includes(s.slug)&&!packageLeaves(catalog,s.slug).some(slug=>leaves.includes(slug))).slice(0,3);
}
