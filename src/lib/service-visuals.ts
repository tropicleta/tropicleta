type ServiceLabel = {name:string;slug:string;kind?:string};
/** Short public labels; identifiers, prices and the editable source name are preserved. */
export function shortServiceName(service:ServiceLabel) {
  if(service.kind==="package")return service.name;
  let name=service.name.trim().replace(/^servicio\s+(?:completo\s+)?(?:de\s+|del\s+|al\s+)?/i,"");
  name=name.replace(/^purga\s+o\s+sangrado\s+de\s+/i,"Purgado ").replace(/^(?:purga|sangrado)\s+(?:de\s+)?/i,"Purgado ");
  name=name.replace(/^ajuste\s+de\s+/i,"Ajuste ").replace(/^recarga\s+(?:o\s+inyección\s+)?de\s+líquido\s+(?:sellante\s+)?tubeless\s+de\s+rueda\s+/i,"Recarga tubeless ");
  name=name.replace(/^tubeless\s+de\s+rueda\s+/i,"Tubeless ").replace(/^centrado\s+de\s+rueda\s+/i,"Centrado ").replace(/^armado\s+de\s+rueda\s+/i,"Armado rueda ");
  name=name.replace(/^cambio\s+de\s+cámara\s+(?:de\s+)?scooter/i,"Cambio cámara scooter").replace(/^limpieza\s+de\s+bicicleta\s+(?:más|y|\+)\s+transmisión/i,"Limpieza bici + transmisión");
  name=name.replace(/^sincronización\s+de\s+cambios/i,"Sincronización cambios").replace(/^eje\s+de\s+dirección/i,"Dirección").replace(/doble suspension/gi,"doble suspensión");
  if(service.slug==="mantencion-de-centro"&&/^motor$/i.test(name))name="Eje de motor";
  if(service.slug==="servicio-completo-horquilla"&&/^horquilla$/i.test(name))name="Horquilla de aire";
  return name.charAt(0).toLocaleUpperCase("es-CL")+name.slice(1);
}

export type ServiceVisual = "frame"|"bleed"|"fork-lowers"|"fork-air"|"fork-spring"|"shock"|"derailleur"|"shifter"|"wax"|"cleaning"|"freehub"|"headset"|"bottom-bracket"|"hub-front"|"hub-rear"|"sealant"|"tubeless"|"truing"|"wheel-build"|"tube"|"brake"|"bolts"|"bike-build"|"electric"|"maintenance";
export function serviceVisual(service:ServiceLabel):ServiceVisual {
  const text=`${service.name} ${service.slug}`.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if(/purg|sangrad/.test(text))return "bleed";
  if(/botellas|basico-horquilla/.test(text))return "fork-lowers";
  if(/horquilla/.test(text))return /mecanic|resorte/.test(text)?"fork-spring":"fork-air";
  if(/shock|amortiguador/.test(text))return "shock";
  if(/pata|desviador/.test(text))return "derailleur";
  if(/encerad|ultrasonic/.test(text))return "wax";
  if(/sincron|cambios|ajuste-de-cambios/.test(text)&&!/frenos/.test(text))return "shifter";
  if(/nucleo/.test(text))return "freehub";
  if(/direccion/.test(text))return "headset";
  if(/motor|centro/.test(text))return "bottom-bracket";
  if(/eje.*traser/.test(text))return "hub-rear";
  if(/eje.*delanter/.test(text))return "hub-front";
  if(/recarga|inyeccion|liquido/.test(text))return "sealant";
  if(/tubeless|tubel/.test(text))return "tubeless";
  if(/centrado/.test(text))return "truing";
  if(/armado.*rueda/.test(text))return "wheel-build";
  if(/camara|pinchazo/.test(text))return "tube";
  if(/freno/.test(text))return "brake";
  if(/cuadro/.test(text))return "frame";
  if(/tornill/.test(text))return "bolts";
  if(/limpieza/.test(text))return "cleaning";
  if(/armado.*bici/.test(text))return "bike-build";
  if(/electrica|ebike/.test(text))return "electric";
  return "maintenance";
}

export const serviceBenefits:Record<ServiceVisual,string>={
  frame:"Cuida las articulaciones y puntos de giro.",bleed:"Recupera un tacto de frenado firme.","fork-lowers":"Limpieza y lubricación de las botellas.","fork-air":"Cuida el funcionamiento de tu horquilla.","fork-spring":"Limpieza y ajuste de la horquilla mecánica.",shock:"Cuida la suspensión trasera.",derailleur:"Limpieza y lubricación de la pata de cambio.",shifter:"Cambios más precisos y suaves.",wax:"Menos fricción en tu transmisión.",cleaning:"Limpieza de la bici y su transmisión.",freehub:"Cuida el mecanismo del núcleo.",headset:"Una dirección más suave.","bottom-bracket":"Cuida el eje y sus rodamientos.","hub-front":"Cuida los rodamientos de la rueda delantera.","hub-rear":"Cuida los rodamientos de la rueda trasera.",sealant:"Renueva el líquido sellante de tu rueda.",tubeless:"Prepara tu rueda con cinta y sellante.",truing:"Mejora la alineación de la rueda.","wheel-build":"Armado y tensado; rayos por separado.",tube:"Cambio de cámara para tu scooter.",brake:"Revisión y ajuste del frenado.",bolts:"Revisión de los puntos de fijación.","bike-build":"Deja tu bicicleta nueva lista para rodar.",electric:"Cuida tu bicicleta eléctrica.",maintenance:"Cuida tu bicicleta y sigue rodando."
};
