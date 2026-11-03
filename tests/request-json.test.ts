import assert from "node:assert/strict";
import { readRequestJson } from "../src/lib/request-json";

async function main() {
  const request = (body: string) => new Request("https://example.com", { method: "POST", body });
  assert.deepEqual(await readRequestJson(request('{"ok":true}'), 20), { ok: true });
  await assert.rejects(readRequestJson(request("x".repeat(21)), 20), /Body too large/);
  await assert.rejects(readRequestJson(request("{"), 20));
  await assert.rejects(readRequestJson(new Request("https://example.com", { method: "POST", body: "{}", headers: { "content-length": "100" } }), 20), /Body too large/);
  console.log("request-json: OK");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
