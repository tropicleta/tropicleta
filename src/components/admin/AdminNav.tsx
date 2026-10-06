"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const groups = [
  {label:"Tienda",links:[{href:"/admin/productos/",label:"Productos"},{href:"/admin/ordenes/",label:"Órdenes de productos"},{href:"/admin/productos/categorias/",label:"Categorías"},{href:"/admin/productos/papelera/",label:"Papelera de productos"}]},
  {label:"Taller",links:[{href:"/admin/servicios/",label:"Servicios"},{href:"/admin/reservas/",label:"Reservas"},{href:"/admin/servicios/categorias/",label:"Categorías"},{href:"/admin/servicios/papelera/",label:"Papelera de servicios"}]},
];
const general=[{href:"/admin/",label:"Resumen"},{href:"/admin/contabilidad/",label:"Contabilidad"}];
const other=[{href:"/admin/recomendados/",label:"Recomendados"},{href:"/admin/pagos/",label:"Configuración de pagos"},{href:"/admin/mensajes/",label:"Mensajes"},{href:"/admin/actividad/",label:"Actividad"}];
export function AdminNav({badges}:{badges:Record<string,number>}) {
  const raw=usePathname();const pathname=raw.endsWith("/")?raw:raw+"/";
  const link=(item:{href:string;label:string},siblings:{href:string}[])=>{
    const active=item.href==="/admin/"?pathname===item.href:pathname.startsWith(item.href)&&!siblings.some(s=>s.href!==item.href&&s.href.startsWith(item.href)&&pathname.startsWith(s.href));
    return <Link key={item.href} href={item.href} aria-current={active?"page":undefined}>{item.label}{badges[item.href]?<span className="tp-badge tp-badge-orange">{badges[item.href]}</span>:null}</Link>;
  };
  return <nav aria-label="Panel">{general.map(item=>link(item,general))}{groups.map(group=>{
    const active=group.links.some(l=>pathname.startsWith(l.href));const pending=group.links.reduce((n,l)=>n+(badges[l.href]??0),0);
    return <details className="tp-admin-nav-group" key={`${group.label}-${active}`} open={active}><summary>{group.label}{pending>0&&<span className="tp-badge tp-badge-orange">{pending}</span>}</summary><div>{group.links.map(item=>link(item,group.links))}</div></details>;
  })}{other.map(item=>link(item,other))}</nav>;
}
