"use client";
import { useActionState } from "react";
import { savePromotion } from "@/actions/promotions";
import { SubmitButton } from "@/components/SubmitButton";
export function PromotionForm() {
  const [state, action] = useActionState(savePromotion, {});
  return <form action={action} className="tp-form tp-panel">
    <h2>Crear o actualizar un código</h2>
    <label className="tp-field">Código<input name="code" className="tp-input" placeholder="Ej: PEDALEA10" minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" required /></label>
    <label className="tp-field">Descuento (%)<input name="percent" className="tp-input" type="number" min={1} max={100} step={1} required /></label>
    <label className="tp-field">Último día de vigencia (opcional)<input name="expiresOn" className="tp-input" type="date" /></label>
    <p className="tp-hint">Al guardar un código existente lo actualizas y activas. Se aplica a servicios; no incluye transporte ni repuestos. No se suma al beneficio de primera visita: se usa el mayor descuento.</p>
    {state.message && <p role="status" className="tp-alert">{state.message}</p>}
    <SubmitButton pendingText="Guardando…">Guardar código</SubmitButton>
  </form>;
}
