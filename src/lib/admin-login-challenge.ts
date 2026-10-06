import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { and, eq, gt, lt, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export const LOGIN_CODE_SECONDS = 10 * 60;
export function challengeHash(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function issueLoginChallenge(authTag: string, sign: (value: string) => string) {
  const token = randomBytes(32).toString("base64url"), code = String(randomInt(0, 1000000)).padStart(6, "0");
  const hash = challengeHash(token), expiresAt = new Date(Date.now() + LOGIN_CODE_SECONDS * 1000);
  await db.delete(schema.adminLoginChallenges).where(lt(schema.adminLoginChallenges.expiresAt, new Date()));
  await db.insert(schema.adminLoginChallenges).values({ hash, codeHash: sign(`${hash}:${code}`), authTag, expiresAt });
  return { token, code };
}

export async function consumeLoginChallenge(token: string, code: string, authTag: string, sign: (value: string) => string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const hash = challengeHash(token), t = schema.adminLoginChallenges, now = new Date();
  // Reserva cada intento antes de comparar, incluso códigos mal formados.
  const [attempt] = await db.update(t).set({ attempts: sql`${t.attempts} + 1` }).where(and(
    eq(t.hash, hash), eq(t.authTag, authTag), gt(t.expiresAt, now), lt(t.attempts, 5),
  )).returning({ hash: t.hash });
  if (!attempt || !/^\d{6}$/.test(code)) return false;
  const consumed = await db.delete(t).where(and(
    eq(t.hash, hash), eq(t.codeHash, sign(`${hash}:${code}`)), eq(t.authTag, authTag),
    gt(t.expiresAt, now), lte(t.attempts, 5),
  )).returning({ hash: t.hash });
  return consumed.length === 1;
}

export async function removeLoginChallenge(token: string) {
  await db.delete(schema.adminLoginChallenges).where(eq(schema.adminLoginChallenges.hash, challengeHash(token)));
}
