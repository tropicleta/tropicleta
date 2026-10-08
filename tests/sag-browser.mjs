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
  assert.ok(await page.evaluate(() => document.body.textContent.includes("Antes de medir: abre el bloqueo")));
  assert.equal(await page.$("#sag-discipline"), null);
  assert.equal(await page.$eval("#fork-target", node => node.value), "20");
  await page.click('input[value="full"]');
  await page.evaluate(() => { document.querySelectorAll("nav button").forEach(button => { if (button.textContent.includes("Mide el SAG")) button.click(); }); document.querySelectorAll("details").forEach(node => node.open = true); });
  assert.equal(await page.evaluate(() => document.body.textContent.includes("Pedir ayuda al taller")), false);
  await page.select("#fork-brand", "FOX");
  await page.select("#fork-model", "36 · 2024");
  assert.equal(await page.$eval("#fork-target", node => node.value), "17.5");
  await page.click('#fork-title ~ details button[aria-pressed="false"]');
  assert.equal(await page.$eval("#fork-target", node => node.value), "15");
  await page.click('#fork-title ~ details button[aria-pressed="false"]');
  await page.type("#fork-length", "140");
  await page.type("#fork-measured", "28");
  assert.ok(await page.$eval("#fork-result", node => node.textContent.includes("28") && node.textContent.includes("coincide")));
  await page.type("#shock-length", "55");
  await page.type("#shock-measured", "16,5");
  assert.ok(await page.$eval("#shock-result", node => node.textContent.includes("30") && node.textContent.includes("coincide")));
  await page.evaluate(() => { document.querySelectorAll("nav button").forEach(button => { if (button.textContent.includes("Ajusta el rebote")) button.click(); }); });
  await page.evaluate(() => { [...document.querySelectorAll("button")].find(button => button.textContent === "Vuelve con un golpe").click(); });
  assert.ok(await page.evaluate(() => document.body.textContent.includes("un clic hacia más lento según el manual")));
  await page.evaluate(() => { document.querySelectorAll("nav button").forEach(button => { if (button.textContent.includes("Mide el SAG")) button.click(); }); });
  assert.equal(await page.$eval("#fork-length", node => node.value), "140");
  await page.evaluate(() => { document.querySelectorAll("nav button").forEach(button => { if (button.textContent.includes("Prepara")) button.click(); }); });
  assert.equal(await page.$eval("#fork-target", node => node.value), "20");
  assert.equal(await page.$eval("#shock-target", node => node.value), "30");
  await page.evaluate(() => { document.querySelectorAll("nav button").forEach(button => { if (button.textContent.includes("Mide el SAG")) button.click(); }); });
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (width === 1440) {
      const rows = await page.evaluate(() => {
        const box = selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom }; };
        const cards = ["fork", "shock"].map(id => { const rect = document.querySelector(`#${id}-title`).closest("section").getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom }; });
        return { cards, results: [box("#fork-result"), box("#shock-result")], inputs: [box("#fork-length"), box("#shock-length")] };
      });
      for (const pair of Object.values(rows)) {
        assert.ok(Math.abs(pair[0].top - pair[1].top) < 2, "Column tops align");
        assert.ok(Math.abs(pair[0].bottom - pair[1].bottom) < 2, "Column bottoms align");
      }
    }
    await page.screenshot({ path: join(tmpdir(), `tropicleta-sag-${width}.png`), fullPage: true });
  }
  await page.select("#fork-spring", "coil");
  assert.equal(await page.$("#fork-model"), null);
  assert.ok(await page.$eval("#fork-result", node => node.textContent.includes("La precarga no cambia la dureza del muelle")));
  await page.select("#shock-brand", "FOX");
  await page.select("#shock-model", "FLOAT X · 2025");
  assert.equal(await page.$eval("#shock-target", node => node.value), "27.5");
  await page.select("#shock-model", "FLOAT X2 · 2025");
  assert.equal(await page.$eval("#shock-target", node => node.value), "30");
  await page.select("#fork-spring", "air");
  await page.select("#fork-brand", "Marzocchi");
  await page.select("#fork-model", "Bomber Z2 · guía Rev. A");
  assert.equal(await page.$eval("#fork-target", node => node.value), "17.5");
  await page.select("#fork-brand", "RockShox");
  await page.select("#fork-model", "ZEB · DebonAir+");
  assert.ok(await page.$eval("#fork-suggestion", node => node.textContent.includes("no objetivo del manual")));
  await page.select("#fork-brand", "SR Suntour");
  await page.select("#fork-model", "DUROLUX38 EQ · guía 2022");
  assert.equal(await page.$eval("#fork-target", node => node.value), "30");
  assert.deepEqual(errors, []);
  console.log("SAG: selección, cálculo, decimales y distribución móvil/escritorio OK.");
} finally { await browser.close(); }

