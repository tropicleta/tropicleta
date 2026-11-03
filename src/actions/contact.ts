"use server";

import { allowPublicSubmission } from "@/lib/public-limit";

import { db, schema } from "@/db";
import { adminEmail, emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { formToObject, zodErrors, type FormState } from "@/lib/forms";
import { normalizeChileanPhone } from "@/lib/format";
import { contactSchema } from "@/lib/validation";

export async function sendContactMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await allowPublicSubmission("sendContactMessage"))) return { message: "Demasiados intentos. Espera 15 minutos antes de volver a intentar." };
  const values = formToObject(fd);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const d = parsed.data;
  const extra = [
    d.eventDate && `Fecha: ${d.eventDate}`,
    d.eventPlace && `Lugar: ${d.eventPlace}`,
    d.attendees && `Asistentes: ${d.attendees}`,
  ].filter(Boolean);
  const message = extra.length ? `${extra.join(" · ")}\n\n${d.message}` : d.message;

  try {
    await db.insert(schema.contactMessages).values({
      name: d.name,
      phone: d.phone ? normalizeChileanPhone(d.phone) : null,
      email: d.email ?? null,
      message,
      subject: d.subject,
    });
  } catch (e) {
    console.error("[contacto]", e);
    return { message: "No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos por WhatsApp.", values };
  }

  await sendEmail(
    adminEmail(),
    `${d.subject === "eventos" ? "Cotización de evento" : "Nuevo mensaje"} de ${d.name}`,
    emailLayout(
      "Nuevo mensaje",
      `<p><b>${escapeHtml(d.name)}</b><br>${escapeHtml(d.phone ?? "")} ${escapeHtml(d.email ?? "")}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    ),
  );

  return { ok: true, message: "¡Mensaje enviado! Te respondemos a la brevedad." };
}
