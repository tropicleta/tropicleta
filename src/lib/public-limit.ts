import "server-only";
import { createHash } from "node:crypto";
import { clientIp } from "./auth";
import { claimLoginAttempt } from "./login-limit";

/** Shared, atomic database limit: five submissions per IP and action in 15 minutes. */
export async function allowPublicSubmission(action: string, maxAttempts = 5, windowMinutes = 15) {
  try {
    const key = createHash("sha256").update(`${action}:${await clientIp()}`).digest("hex");
    return await claimLoginAttempt(`public:${key}`, maxAttempts, windowMinutes);
  } catch {
    return false;
  }
}
