import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_SECONDS, newAdminToken, verifyAdminToken, passwordFingerprint } from "./admin-session-token";
import { storeAdminSession, touchAdminSession, revokeAdminSession } from "./admin-session-store";

/**
 * Cookie firmada y sesión revocable en BD: 8 horas máximas y 30 minutos de inactividad.
 *
 * La cookie incluye una huella de la contraseña: al cambiar ADMIN_PASSWORD (o SESSION_SECRET)
 * todas las sesiones abiertas dejan de ser válidas.
 */
const COOKIE = process.env.NODE_ENV === "production" ? "__Host-tp_admin" : "tp_admin";

const isProd = process.env.NODE_ENV === "production";
// En desarrollo hay valores por defecto para entrar sin configurar nada. En producción son obligatorios.
const DEV_PASSWORD = "tropicleta";
const DEV_SECRET = "solo-desarrollo-no-usar-en-produccion";

function secret() {
  const s = process.env.SESSION_SECRET ?? (isProd ? undefined : DEV_SECRET);
  if (!s || s.length < 16) throw new Error("Define SESSION_SECRET (mín. 16 caracteres)");
  return s;
}

function expectedPassword() {
  return process.env.ADMIN_PASSWORD ?? (isProd ? undefined : DEV_PASSWORD);
}

function sessionCredential() {
  return `${expectedPassword() ?? ""}\0${process.env.ADMIN_LOGIN_EMAIL ?? ""}`;
}

export function adminAuthFingerprint() { return passwordFingerprint(sessionCredential(), secret()); }
export function signLoginCode(value: string) { return sign(`login-code:${value}`); }

export { adminConfigurationError } from "./auth-config";

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(input: string) {
  const expected = expectedPassword();
  if (!expected) return false;
  return safeEqual(sign(input), sign(expected));
}

export async function createSession() {
  const session = newAdminToken(secret(), sessionCredential());
  await storeAdminSession(session.hash, session.expiresAt);
  (await cookies()).set(COOKIE, session.token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  if (isProd) (await cookies()).delete("tp_admin");
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  try {
    const hash = raw ? verifyAdminToken(raw, secret(), sessionCredential()) : null;
    if (hash) await revokeAdminSession(hash);
  } finally {
    jar.delete(COOKIE);
    if (isProd) jar.delete("tp_admin");
  }
}

export async function isAdmin() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  try {
    const hash = verifyAdminToken(raw, secret(), sessionCredential());
    return hash ? await touchAdminSession(hash) : false;
  } catch {
    return false;
  }
}

/** Úsalo al inicio de cada server action y página del panel (el layout no basta: no se re-ejecuta al navegar). */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login/");
}

/** IP del cliente según el proxy (Vercel define x-forwarded-for). */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim().slice(0, 64);
}
