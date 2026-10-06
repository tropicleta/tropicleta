import Link from "next/link";
import { deleteServicePermanently, removeService, restoreService } from "@/actions/admin";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { packageReference } from "@/lib/package-reference";
import { requestedPackageReferences } from "@/data/package-references";
import { formatCLP } from "@/lib/format";
import type { Service } from "@/db/schema";
export function PacksAdminPanel({catalog,showRemoved}:{catalog:Service[];showRemoved:boolean}) {
  const packs=catalog.filter(s=>s.kind==="package"&&s.removed===showRemoved);
  return (
      <section className="tp-panel" style={{marginTop:24,marginBottom:24}}>
        <div className="tp-admin-title"><h2>Packs de servicios</h2><Link className="tp-btn tp-btn-primary tp-btn-sm" href="/admin/servicios/packs/nuevo/">Nuevo pack de servicios</Link></div>
        <p className="tp-muted tp-small">Vincula servicios individuales o packs, define el precio y activa el pack cuando esté listo. El ahorro usa los precios individuales actuales.</p>
        <div className="tp-table-wrap"><table className="tp-table"><thead><tr><th>Pack</th><th>Precio</th><th>Valor individual / ahorro</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{packs.map(s=>{const ref=packageReference(catalog,s);return <tr key={s.id}><td><Link href={`/admin/servicios/packs/${s.id}/`}>{s.name}</Link><small style={{display:"block"}}>{showRemoved && <>URL: {s.slug}<br/></>}{s.components.filter(c=>!c.recommended).length} componentes{s.requiresDoubleSuspension?" · Doble suspensión":""}</small></td><td>{s.price===null?"A cotizar":formatCLP(s.price)}</td><td>{ref?`${formatCLP(ref.reference)} / ${ref.savings===null?"—":formatCLP(ref.savings)}`:"Por definir"}{ref && requestedPackageReferences[s.slug] && requestedPackageReferences[s.slug]!==ref.reference && <small style={{display:"block",color:"#fbbf24"}}>Documento: {formatCLP(requestedPackageReferences[s.slug])} · Revisar diferencia</small>}</td><td>{s.removed?"Quitado":s.active?"Activo":"Borrador"}</td><td><form action={s.removed?restoreService:removeService}><input type="hidden" name="id" value={s.id}/><ConfirmSubmit message={s.removed?`¿Recuperar “${s.name}” como borrador?`:`¿Quitar “${s.name}”? Podrás recuperarlo y conservarás el historial.`}>{s.removed?"Recuperar":"Quitar"}</ConfirmSubmit></form>{s.removed&&<form action={deleteServicePermanently}><input type="hidden" name="id" value={s.id}/><ConfirmSubmit message={`¿Eliminar definitivamente “${s.name}”? No se puede recuperar. Se liberará la URL ${s.slug}.`}>Eliminar definitivamente</ConfirmSubmit></form>}</td></tr>})}{!packs.length&&<tr><td colSpan={5}>No hay packs en este listado.</td></tr>}</tbody></table></div>
      </section>
  );
}
