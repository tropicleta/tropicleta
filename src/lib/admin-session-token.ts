import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
export const ADMIN_IDLE_SECONDS = 30 * 60;

export function constantEqual(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function passwordFingerprint(password: string, secret: string) {
  return sign(`pw:${password}`, secret).slice(0, 16);
}

export function newAdminToken(secret: string, password: string, now = Date.now()) {
  const id = randomBytes(32).toString("base64url");
  const expires = Math.floor(now / 1000) + ADMIN_SESSION_SECONDS;
  const payload = `v2.${id}.${expires}.${passwordFingerprint(password, secret)}`;
  return { token: `${payload}.${sign(payload, secret)}`, hash: createHash("sha256").update(id).digest("hex"), expiresAt: new Date(expires * 1000) };
}

export function verifyAdminToken(raw: string, secret: string, password: string, now = Date.now()) {
  if (raw.length > 256) return null;
  const match = /^v2\.([A-Za-z0-9_-]{43})\.(\d{10})\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{43})$/.exec(raw);
  if (!match) return null;
  const [, id, expiration, fingerprint, signature] = match;
  const expires = Number(expiration);
  if (expires <= now / 1000 || expires > now / 1000 + ADMIN_SESSION_SECONDS ||
      !constantEqual(signature, sign(raw.slice(0, raw.lastIndexOf(".")), secret)) ||
      !constantEqual(fingerprint, passwordFingerprint(password, secret))) return null;
  return createHash("sha256").update(id).digest("hex");
}
