"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuthFingerprint, signLoginCode, createSession, clientIp } from "@/lib/auth";
import { consumeLoginChallenge, removeLoginChallenge } from "@/lib/admin-login-challenge";
import { clearLoginFailures } from "@/lib/login-limit";
import { audit } from "@/lib/audit";
import type { FormState } from "@/lib/forms";

const CHALLENGE_COOKIE = process.env.NODE_ENV === "production" ? "__Host-tp_login" : "tp_login";

export async function verifyLoginCode(_previous: FormState, fd: FormData): Promise<FormState> {
  const jar = await cookies(), token = jar.get(CHALLENGE_COOKIE)?.value;
  if (!process.env.ADMIN_LOGIN_EMAIL || !token) return { message: "El código caducó. Vuelve a ingresar tu contraseña." };
  try {
    if (!(await consumeLoginChallenge(token, String(fd.get("code") ?? "").trim(), adminAuthFingerprint(), signLoginCode)))
      return { message: "Código incorrecto o caducado. Tienes un máximo de 5 intentos; después debes empezar nuevamente." };
    jar.delete(CHALLENGE_COOKIE);
    await createSession();
    await clearLoginFailures(await clientIp());
    await audit("login", "sesion", null, "Ingreso al panel con código por correo");
  } catch {
    return { message: "No pudimos verificar el código. Intenta nuevamente." };
  }
  redirect("/admin/");
}

export async function restartAdminLogin() {
  const jar = await cookies(), token = jar.get(CHALLENGE_COOKIE)?.value;
  if (token) await removeLoginChallenge(token);
  jar.delete(CHALLENGE_COOKIE);
  redirect("/admin/login/");
}
