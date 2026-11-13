import assert from "node:assert/strict";
import { validateImages, uploadImage } from "../src/lib/upload";

// A missing storage token must never fall through to a serverless local disk write.
const keys = ["VERCEL", "VERCEL_ENV", "VERCEL_URL", "AWS_LAMBDA_FUNCTION_NAME", "BLOB_READ_WRITE_TOKEN", "BLOB_STORE_ID"];
async function main() {
const previous = new Map(keys.map(key => [key, process.env[key]]));
try {
  for (const key of keys) delete process.env[key];
  const image = new File(["test"], "test.png", { type: "image/png" });
  assert.equal(validateImages([image]), null);
  for (const platform of ["VERCEL", "AWS_LAMBDA_FUNCTION_NAME"]) {
    process.env[platform] = "test-function";
    assert.match(validateImages([image])!, /almacenamiento/);
    assert.equal(validateImages([]), null);
    await assert.rejects(uploadImage(image, "test"), /almacenamiento/);
    delete process.env[platform];
  }
  await assert.rejects(uploadImage(new File(["test"], "test.html", { type: "text/html" }), "test"), /no es JPG/);
  console.info("Serverless uploads: protected on Vercel and Netlify Lambda without network or filesystem writes.");
} finally {
  for (const key of keys) {
    const value = previous.get(key);
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
}
main().catch(error => { console.error(error); process.exitCode = 1; });
