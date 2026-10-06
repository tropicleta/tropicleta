import "server-only";
import { and, eq, gt, or, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { ADMIN_IDLE_SECONDS } from "./admin-session-token";

export async function storeAdminSession(hash: string, expiresAt: Date) {
  const now = new Date();
  const idleCutoff = new Date(now.getTime() - ADMIN_IDLE_SECONDS * 1000);
  await db.delete(schema.adminSessions).where(or(lt(schema.adminSessions.expiresAt, now), lt(schema.adminSessions.lastSeenAt, idleCutoff)));
  await db.insert(schema.adminSessions).values({ hash, expiresAt, lastSeenAt: now });
}

export async function touchAdminSession(hash: string, now = new Date()) {
  const t = schema.adminSessions;
  const rows = await db.update(t).set({ lastSeenAt: now }).where(and(
    eq(t.hash, hash), gt(t.expiresAt, now), gt(t.lastSeenAt, new Date(now.getTime() - ADMIN_IDLE_SECONDS * 1000)),
  )).returning({ hash: t.hash });
  return rows.length === 1;
}

export async function revokeAdminSession(hash: string) {
  await db.delete(schema.adminSessions).where(eq(schema.adminSessions.hash, hash));
}
