"use client";

import { useActionState } from "react";
import { saveRecommendation } from "@/actions/recommendations";
import { SubmitButton } from "@/components/SubmitButton";

type Recommendation = { id: number; name: string; category: string; reason: string; url: string; active: boolean; imageUrl?: string | null; price?: number | null };

export function RecommendationForm({ item }: { item?: Recommendation }) {
  const [state, action] = useActionState(saveRecommendation, {});
  return <form action={action} className="tp-panel tp-form">
    <h2>{item ? item.name : "Nueva recomendación"}</h2>
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="tp-label">Nombre<input className="tp-input" name="name" defaultValue={item?.name} required maxLength={140} /></label>
    <label className="tp-label">Categoría<input className="tp-input" name="category" defaultValue={item?.category} required maxLength={60} placeholder="Ej.: Seguridad, Mantención, Accesorios" /></label>
    <label className="tp-label">Por qué lo recomiendo<textarea className="tp-input" name="reason" defaultValue={item?.reason} required minLength={15} maxLength={1200} rows={3} /></label>
    <label className="tp-label">Enlace de afiliado<input className="tp-input" name="url" type="url" defaultValue={item?.url} required placeholder="https://meli.la/…" maxLength={2000} /></label>
    <label className="tp-label">Foto de la publicación<input className="tp-input" name="imageUrl" type="url" defaultValue={item?.imageUrl ?? ""} placeholder="https://http2.mlstatic.com/…" maxLength={2000} /></label>
    <label className="tp-label">Precio referencial (CLP)<input className="tp-input" name="price" type="number" min={1} max={2147483647} step={1} defaultValue={item?.price ?? ""} /></label>
    <p className="tp-hint">Actualiza la foto y el precio cuando cambie la publicación. El precio no se sincroniza automáticamente.</p>
    <p className="tp-hint">Pega el enlace generado por tu cuenta de afiliados. No se crean enlaces ni comisiones automáticamente.</p>
    <label><input type="checkbox" name="active" defaultChecked={item?.active ?? false} /> Publicar en Recomendados</label>
    {state.message && <p className="tp-alert" role="status">{state.message}</p>}
    <SubmitButton pendingText="Guardando…">Guardar recomendación</SubmitButton>
  </form>;
}
