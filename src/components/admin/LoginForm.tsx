"use client";

import { useActionState, useState } from "react";
import { login } from "@/actions/admin";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/lib/forms";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="tp-form">
      {state.message && (
        <div className="tp-alert" role="alert">
          {state.message}
        </div>
      )}
      <div className="tp-field">
        <label className="tp-label" htmlFor="password">
          Contraseña
        </label>
        <input id="password" name="password" type={visible ? "text" : "password"} className="tp-input" autoComplete="current-password" required autoFocus maxLength={256} />
        <button type="button" className="tp-link-btn" aria-controls="password" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Ocultar contraseña" : "Mostrar contraseña"}</button>
      </div>
      <SubmitButton className="tp-btn tp-btn-primary tp-btn-block" pendingText="Ingresando…">
        Ingresar
      </SubmitButton>
      <p className="tp-hint">Por seguridad, la sesión se cierra después de 30 minutos sin actividad o al cumplir 8 horas. Cierra sesión al terminar en un equipo compartido.</p>
    </form>
  );
}
