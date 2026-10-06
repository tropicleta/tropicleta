"use client";
import { useActionState } from "react";
import { verifyLoginCode, restartAdminLogin } from "@/actions/admin-login-code";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/lib/forms";

export function LoginCodeForm() {
  const [state, action] = useActionState<FormState, FormData>(verifyLoginCode, {});
  return <>
    <p>Enviamos un código al correo autorizado. Revisa también la carpeta de spam. Caduca en 10 minutos.</p>
    <form action={action} className="tp-form">
      {state.message && <p className="tp-alert" role="alert">{state.message}</p>}
      <label className="tp-label" htmlFor="code">Código de 6 dígitos</label>
      <input className="tp-input" id="code" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoFocus />
      <SubmitButton pendingText="Verificando…">Verificar e ingresar</SubmitButton>
    </form>
    <form action={restartAdminLogin}><button className="tp-btn tp-btn-secondary" type="submit">Volver a ingresar contraseña</button></form>
  </>;
}
