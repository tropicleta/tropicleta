import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

/** true si la IP superó los intentos fallidos en la ventana actual. Se guarda en la BD para valer entre instancias. */
export async function loginBlocked(ip: string) {
  const [row] = await db.select().from(schema.loginAttempts).where(eq(schema.loginAttempts.key, ip)).limit(1);
  if (!row) return false;
  const expired = Date.now() - row.windowStart.getTime() > WINDOW_MINUTES * 60_000;
  return !expired && row.count >= MAX_ATTEMPTS;
}

export async function recordLoginFailure(ip: string) {
  const t = schema.loginAttempts;
  const expired = sql`${t.windowStart} < now() - make_interval(mins => ${WINDOW_MINUTES})`;
  await db
    .insert(t)
    .values({ key: ip, count: 1 })
    .onConflictDoUpdate({
      target: t.key,
      set: {
        count: sql`case when ${expired} then 1 else ${t.count} + 1 end`,
        windowStart: sql`case when ${expired} then now() else ${t.windowStart} end`,
      },
    });
}

/** Reserva atómica antes de verificar credenciales: solicitudes concurrentes no saltan el límite. */
export async function claimLoginAttempt(ip: string) {
  const t = schema.loginAttempts;
  const expired = sql`${t.windowStart} <= now() - make_interval(mins => ${WINDOW_MINUTES})`;
  const [row] = await db.insert(t).values({ key: ip, count: 1 }).onConflictDoUpdate({
    target: t.key,
    set: {
      count: sql`case when ${expired} then 1 else least(${t.count} + 1, ${MAX_ATTEMPTS + 1}) end`,
      windowStart: sql`case when ${expired} then now() else ${t.windowStart} end`,
    },
  }).returning({ count: t.count });
  return row.count <= MAX_ATTEMPTS;
}

export async function clearLoginFailures(ip: string) {
  await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.key, ip));
}
