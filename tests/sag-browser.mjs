import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { tmpdir } from "node:os";
import { join } from "node:path";

const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`${process.env.SAG_TEST_ORIGIN || "http://localhost:3012"}/calculador-sag/`, { waitUntil: "networkidle0" });
  assert.equal(await page.$$eval('input[type="radio"]', nodes => nodes.length), 2);
  await page.select("#fork-brand", "FOX");
  await page.select("#fork-model", "36 · 2024");
  assert.equal(await page.$eval("#fork-target", node => node.value), "20");
  await page.click('button[aria-pressed="false"]');
  assert.equal(await page.$eval("#fork-target", node => node.value), "15");
  await page.click('button[aria-pressed="false"]');
  await page.type("#fork-length", "140");
  await page.type("#fork-measured", "28");
  assert.ok(await page.$eval("#fork-result", node => node.textContent.includes("28") && node.textContent.includes("coincide")));
  await page.click('input[value="full"]');
  await page.type("#shock-length", "55");
  await page.type("#shock-measured", "16,5");
  assert.ok(await page.$eval("#shock-result", node => node.textContent.includes("30") && node.textContent.includes("coincide")));
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(tmpdir(), `tropicleta-sag-${width}.png`), fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log("SAG: selección, cálculo, decimales y distribución móvil/escritorio OK.");
} finally { await browser.close(); }
