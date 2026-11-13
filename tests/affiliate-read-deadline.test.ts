import assert from "node:assert/strict";
import { withAffiliateReadDeadline, isNetlifyRuntime } from "../src/lib/affiliate-read-deadline";

async function main() {
  assert.equal(isNetlifyRuntime({ SITE_ID: "test-site" }), true);
  assert.equal(isNetlifyRuntime({ NETLIFY: "true" }), true);
  assert.equal(isNetlifyRuntime({ VERCEL: "1" }), false);
  let signal: AbortSignal | undefined;
  await assert.rejects(withAffiliateReadDeadline(async received => {
    signal = received;
    // A stalled provider must not keep the request waiting indefinitely.
    return new Promise<never>(() => {});
  }, true, 10), /tiempo disponible en Netlify/);
  assert.equal(signal?.aborted, true);
  assert.equal(await withAffiliateReadDeadline(async received => {
    signal = received;
    return "complete-list";
  }, true, 100), "complete-list");
  assert.equal(signal?.aborted, true);
  const originalError = new Error("provider refused");
  await assert.rejects(withAffiliateReadDeadline(async () => { throw originalError; }, true), error => error === originalError);
  assert.equal(await withAffiliateReadDeadline(async received => {
    assert.equal(received, undefined);
    return "existing-platform-behavior";
  }, false, 0), "existing-platform-behavior");
  console.info("Affiliate read deadline: hung provider bounded, browser abort signaled, success and provider errors preserved.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
