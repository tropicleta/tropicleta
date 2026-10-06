import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/db/schema";
import { canTransitionOrder } from "../src/lib/order-status";
import { isForeignKeyViolation, isUniqueViolation } from "../src/lib/db-errors";

async function main() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  (globalThis as Record<string, unknown>).__tpDb = db;
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    const { loginBlocked, recordLoginFailure, clearLoginFailures, claimLoginAttempt } = await import("../src/lib/login-limit");
    const { searchWhere } = await import("../src/lib/admin-queries");

    // Transiciones: pendientes/rechazadas solo las mueve la pasarela
    assert.equal(canTransitionOrder("pendiente", "pagada"), false);
    assert.equal(canTransitionOrder("rechazada", "pagada"), false);
    assert.equal(canTransitionOrder("anulada", "pagada"), false);
    assert.equal(canTransitionOrder("pagada", "lista"), true);
    assert.equal(canTransitionOrder("lista", "anulada"), true);

    // Límite de intentos por IP, persistido en la BD
    for (let i = 0; i < 4; i++) await recordLoginFailure("1.1.1.1");
    assert.equal(await loginBlocked("1.1.1.1"), false);
    await recordLoginFailure("1.1.1.1");
    assert.equal(await loginBlocked("1.1.1.1"), true);
    assert.equal(await loginBlocked("2.2.2.2"), false); // otra IP no queda bloqueada
    await client.query(`update login_attempts set window_start = now() - interval '16 minutes'`);
    assert.equal(await loginBlocked("1.1.1.1"), false); // ventana vencida
    await recordLoginFailure("1.1.1.1");
    const [row] = await db.select().from(schema.loginAttempts);
    assert.equal(row.count, 1); // se reinicia el contador
    await clearLoginFailures("1.1.1.1");
    assert.equal((await db.select().from(schema.loginAttempts)).length, 0);
    const concurrent = await Promise.all(Array.from({ length: 20 }, () => claimLoginAttempt("concurrent-ip")));
    assert.equal(concurrent.filter(Boolean).length, 5);

    const { newAdminToken, verifyAdminToken, ADMIN_IDLE_SECONDS } = await import("../src/lib/admin-session-token");
    const { storeAdminSession, touchAdminSession, revokeAdminSession } = await import("../src/lib/admin-session-store");
    const now = Date.now(), secret = "test-secret-with-32-characters-for-tests", password = "test-password";
    const session = newAdminToken(secret, password, now);
    assert.equal(verifyAdminToken(session.token, secret, password, now), session.hash);
    assert.equal(verifyAdminToken(session.token.replace(/^v3/, "v2"), secret, password, now), null);
    assert.equal(verifyAdminToken(session.token, secret, "changed-password", now), null);
    assert.equal(verifyAdminToken(session.token, "changed-secret", password, now), null);
    assert.equal(verifyAdminToken(session.token + "x", secret, password, now), null);
    assert.equal(verifyAdminToken(session.token, secret, password, session.expiresAt.getTime()), null);
    assert.equal(verifyAdminToken("admin.9999999999.old.unsigned", secret, password, now), null);
    await storeAdminSession(session.hash, session.expiresAt);
    assert.equal(await touchAdminSession(session.hash), true);
    await revokeAdminSession(session.hash);
    assert.equal(await touchAdminSession(session.hash), false); // una copia de la cookie tampoco funciona
    await storeAdminSession(session.hash, session.expiresAt);
    await db.update(schema.adminSessions).set({lastSeenAt:new Date(now - (ADMIN_IDLE_SECONDS + 1) * 1000)});
    assert.equal(await touchAdminSession(session.hash), false); // no revivir sesiones inactivas

    const { issueLoginChallenge, consumeLoginChallenge } = await import("../src/lib/admin-login-challenge");
    const { createHmac } = await import("node:crypto");
    const legacyPayload = session.token.slice(0, session.token.lastIndexOf(".")).replace(/^v3/, "v2");
    const legacyToken = `${legacyPayload}.${createHmac("sha256", secret).update(legacyPayload).digest("base64url")}`;
    assert.equal(verifyAdminToken(legacyToken, secret, password, now), null); // incluso una sesión v2 correctamente firmada
    const signer = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
    const otp = await issueLoginChallenge("test-tag", signer);
    const wrongCode = otp.code === "000000" ? "000001" : "000000";
    assert.equal(await consumeLoginChallenge(otp.token, wrongCode, "test-tag", signer), false);
    assert.equal(await consumeLoginChallenge(otp.token, otp.code, "wrong-tag", signer), false);
    const confirmations = await Promise.all([
      consumeLoginChallenge(otp.token, otp.code, "test-tag", signer),
      consumeLoginChallenge(otp.token, otp.code, "test-tag", signer),
    ]);
    assert.equal(confirmations.filter(Boolean).length, 1); // solo un ingreso por código
    assert.equal(await consumeLoginChallenge(otp.token, otp.code, "test-tag", signer), false);
    const locked = await issueLoginChallenge("test-tag", signer);
    for (let i=0;i<5;i++) assert.equal(await consumeLoginChallenge(locked.token, "invalid", "test-tag", signer), false);
    assert.equal(await consumeLoginChallenge(locked.token, locked.code, "test-tag", signer), false);
    const expired = await issueLoginChallenge("test-tag", signer);
    await db.update(schema.adminLoginChallenges).set({expiresAt:new Date(Date.now()-1000)});
    assert.equal(await consumeLoginChallenge(expired.token, expired.code, "test-tag", signer), false);

    // Violación de unicidad detectada por código de PostgreSQL
    await db.insert(schema.productCategories).values({ name: "A", slug: "a" });
    await assert.rejects(db.insert(schema.productCategories).values({ name: "B", slug: "a" }), (e) => isUniqueViolation(e));

    // Categoría de servicio con servicios: ON DELETE RESTRICT
    const [sc] = await db.insert(schema.serviceCategories).values({ name: "Categoría de prueba", slug: "qa-frenos" }).returning();
    await db.insert(schema.services).values({ name: "Purga", slug: "purga", categoryId: sc.id });
    await assert.rejects(db.delete(schema.serviceCategories), (e) => isForeignKeyViolation(e));

    // Búsqueda por celular con formato libre
    const booking = { code: "TP-AAA111", name: "Ana Pérez", phone: "56912345678", vehicleType: "bicicleta", preferredDate: "2026-01-10", timeSlot: "manana" };
    await db.insert(schema.bookings).values(booking);
    const t = schema.bookings;
    for (const q of ["+56 9 1234 5678", "ana", "tp-aaa", "1234"]) {
      const found = await db.select().from(t).where(searchWhere(q, [t.code, t.name], [t.phone]));
      assert.equal(found.length, 1, `busca "${q}"`);
    }
    assert.equal((await db.select().from(t).where(searchWhere("100%", [t.name]))).length, 0); // comodines escapados

    console.log("PASS: order transitions, login rate limit, unique violations, admin search");
  } finally {
    await client.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
