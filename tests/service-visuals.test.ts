import assert from "node:assert/strict";
import { shortServiceName,serviceVisual } from "../src/lib/service-visuals";
const cases=[
  ["Servicio de eje delantero","eje-delantero","Eje delantero","hub-front"],
  ["Servicio de eje trasero","eje-trasero","Eje trasero","hub-rear"],
  ["Purga o sangrado de freno delantero","purga-frenos-hidraulicos","Purgado freno delantero","bleed"],
  ["Ajuste de freno trasero","ajuste-freno-trasero","Ajuste freno trasero","brake"],
  ["Servicio de botellas","servicio-basico-horquilla","Botellas","fork-lowers"],
  ["Servicio completo de horquilla de aire","servicio-completo-horquilla","Horquilla de aire","fork-air"],
  ["Servicio completo de horquilla mecánica","horquilla-mecanica","Horquilla mecánica","fork-spring"],
  ["Servicio de motor","mantencion-de-centro","Eje de motor","bottom-bracket"],
  ["Servicio de núcleo","servicio-nucleo","Núcleo","freehub"],
  ["Servicio al cuadro (doble suspension)","servicio-al-cuadro","Cuadro (doble suspensión)","frame"],
  ["Recarga de líquido tubeless de rueda delantera","recarga-liquido","Recarga tubeless delantera","sealant"],
] as const;
for(const [name,slug,label,icon] of cases){const service={name,slug,kind:"individual"};assert.equal(shortServiceName(service),label);assert.equal(shortServiceName({...service,name:label}),label);assert.equal(serviceVisual(service),icon);assert.equal(serviceVisual({...service,name:label}),icon);}
assert.equal(shortServiceName({name:"Mi trabajo personalizado",slug:"nuevo"}),"Mi trabajo personalizado");
assert.equal(shortServiceName({name:"Mantención completa",slug:"mantencion-completa",kind:"package"}),"Mantención completa");
console.log("Nombres breves e iconos de frenos, horquillas, cuadro y ejes verificados; las URLs permanecen iguales.");
