import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Run against a local dev server. BIOMETRIA_POSE_FIXTURE optionally points to
// Google's public pose.jpg sample (not a cyclist; tests inference only).
const origin = process.env.BIOMETRIA_TEST_ORIGIN || "http://localhost:3012";
const fixture = process.env.BIOMETRIA_POSE_FIXTURE || process.argv[2];
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  const assetErrors = [];
  const externalRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.url().includes("/biometria/") && response.status() >= 400) assetErrors.push(response.url()); });
  page.on("request", (request) => { if (request.url().startsWith("http") && !request.url().startsWith(origin)) externalRequests.push(request.url()); });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`${origin}/biometria/`, { waitUntil: "networkidle0" });
  await page.select("#fit-discipline", "dh");
  assert.ok(await page.evaluate(() => document.body.textContent.includes("No interpretes ese rango como un objetivo de downhill")));
  assert.equal(await page.$eval("button.tp-btn-primary", (button) => button.disabled), true);
  // The example demonstrates the workflow without consent, a camera or inference.
  await page.evaluate(() => [...document.querySelectorAll("button")].find((button) => button.textContent === "Ver ejemplo de resultados").click());
  await page.waitForFunction(() => document.querySelector('[role="status"]').textContent.includes("Ejemplo ilustrativo"));
  assert.equal(await page.$$eval("dd", (items) => items.every((item) => item.textContent.includes("°"))), true);
  assert.equal(await page.$eval("video", (video) => video.srcObject), null);
  assert.equal(await page.$eval('input[type="checkbox"]', (input) => input.checked), false);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((button) => button.textContent === "Apagar y borrar").click());
  await page.screenshot({ path: join(tmpdir(), "tropicleta-biometria-desktop.png"), fullPage: true });
  await page.setViewport({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: join(tmpdir(), "tropicleta-biometria-mobile.png"), fullPage: true });
  await page.click('input[type="checkbox"]');
  // Feed a blank photo through the real local model/worker.
  await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
    const context = canvas.getContext("2d"); context.fillStyle = "#222"; context.fillRect(0,0,640,480);
    canvas.toBlob((blob) => {
      const dt = new DataTransfer(); dt.items.add(new File([blob], "blank.png", { type: "image/png" }));
      const input = document.querySelector('input[type="file"]'); input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
  await page.waitForFunction(() => document.querySelector('[role="status"]').textContent.includes("No detectamos una persona"), { timeout: 90000 });
  assert.deepEqual(await page.$$eval("dd", (items) => items.map((item) => item.textContent)), ["—", "—", "—", "—"]);
  if (fixture) {
    await (await page.$('input[type="file"]')).uploadFile(fixture);
    await page.waitForFunction(() => document.querySelector('[role="status"]').textContent.includes("Análisis local activo"), { timeout: 90000 });
    await page.select("select", "left");
    // Explicitly select the framing checkbox (second checkbox in DOM).
    const checks = await page.$$('input[type="checkbox"]');
    if (!(await checks[1].evaluate((input) => input.checked))) await checks[1].click();
    console.log("Real pose sample:", await page.$$eval("dd", (items) => items.map((item) => item.textContent)));
    assert.equal(await page.$$eval("dd", (items) => items.every((item) => item.textContent.includes("°"))), true);
    assert.equal(await checks[2].evaluate((input) => input.disabled), false);
    await checks[2].click();
    await page.waitForFunction(() => document.body.textContent.includes("La estimación está fuera de esta referencia"));
    await checks[1].click();
    assert.deepEqual(await page.$$eval("dd", (items) => items.map((item) => item.textContent)), ["—", "—", "—", "—"]);
    assert.equal(await checks[2].evaluate((input) => input.checked), false);
  }
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "Apagar y borrar").click());
  await page.click("button.tp-btn-primary");
  await page.waitForFunction(() => document.querySelector('[role="status"]').textContent.includes("No detectamos una persona"), { timeout: 90000 });
  assert.equal(await page.$eval("video", (video) => video.srcObject.getVideoTracks()[0].readyState), "live");
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "Apagar y borrar").click());
  assert.equal(await page.$eval("video", (video) => video.srcObject), null);
  // Explicit permission denial and unsupported browser, independent of model inference.
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Denied", "NotAllowedError"); }; });
  await page.click("button.tp-btn-primary");
  await page.waitForFunction(() => document.querySelector('[role="status"]').textContent.includes("Permiso de cámara denegado"));
  await page.evaluate(() => { Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true }); });
  await page.click("button.tp-btn-primary");
  await page.waitForFunction(() => document.querySelector('[role="status"]').textContent.includes("requiere HTTPS"));
  assert.deepEqual(errors, []);
  assert.deepEqual(assetErrors, []);
  assert.deepEqual(externalRequests, []);
  console.log("Biometría: móvil/escritorio, consentimiento, modelo real, cámara, permisos, incompatibilidad y solicitudes locales OK.");
  console.log("Screenshots:", join(tmpdir(), "tropicleta-biometria-desktop.png"), join(tmpdir(), "tropicleta-biometria-mobile.png"));
} finally { await browser.close(); }
