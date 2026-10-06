import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Tropicleta <onboarding@resend.dev>";

/** Envía un email con Resend. Sin RESEND_API_KEY lo deja en consola (desarrollo). Nunca lanza. */
export async function sendEmail(to: string | undefined | null, subject: string, html: string) {
  if (!to) return false;
  if (!resend) {
    console.info(`[email:dev] → ${to} · ${subject}`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[email] error", error);
    return !error;
  } catch (e) {
    console.error("[email] excepción", e);
    return false;
  }
}

export const adminEmail = () => process.env.ADMIN_EMAIL;

/** Plantilla base con el estilo Tropicleta (inline para clientes de correo). */
export function emailLayout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#0d0e0f;font-family:Arial,sans-serif;color:#f5f5f2">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:22px;font-weight:900;letter-spacing:.5px;text-transform:uppercase;margin-bottom:24px">
      <span style="color:#f28a17">●</span> Tropicleta
    </div>
    <div style="background:#1b1d20;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:26px">
      <h1 style="margin:0 0 14px;font-size:22px;text-transform:uppercase">${title}</h1>
      <div style="color:#d3d5d7;font-size:15px;line-height:1.6">${body}</div>
    </div>
    <p style="color:#6f747a;font-size:12px;margin-top:20px">Tropicleta · Tierra Amarilla, Región de Atacama</p>
  </div></body></html>`;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
