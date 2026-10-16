import assert from "node:assert/strict";

// Run against a local production server: SEO_TEST_URL=http://localhost:3108
const origin = process.env.SEO_TEST_URL ?? "http://localhost:3108";
const canonicalOrigin = (process.env.SEO_CANONICAL_URL ?? "https://www.tropicleta.com").replace(/\/$/, "");
async function page(path) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200, path);
  return response.text();
}
function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
}
const home = await page("/");
assert.equal([...home.matchAll(/<h1\b/g)].length, 1);
assert.match(home, /Taller de bicicletas/);
assert.ok(home.includes(`<link rel="canonical" href="${canonicalOrigin}/"`), "Homepage canonical matches configured public origin");
assert.ok(jsonLd(home).some(data => data.hasMap === "https://www.google.com/maps?cid=16614543370593599727"));

const catalog = await page("/servicios/");
const links = [...catalog.matchAll(/href="(\/servicios\/[^/"?#]+\/)"/g)].map(match => match[1]);
assert.ok(links.length > 0, "Service detail pages need crawlable HTML links");
const serviceHtml = await page(links[0]);
const graph = jsonLd(serviceHtml).flatMap(data => data["@graph"] ?? []);
assert.ok(graph.some(data => data["@type"] === "Service" && data.provider["@id"] === `${canonicalOrigin}/#taller`));
assert.ok(graph.some(data => data["@type"] === "BreadcrumbList" && data.itemListElement.length === 3));

const article = await page("/consejos/cuidar-la-cadena/");
assert.ok(jsonLd(article).some(data => data["@type"] === "Article" && data.mainEntityOfPage === `${canonicalOrigin}/consejos/cuidar-la-cadena/`));
const sitemap = await page("/sitemap.xml");
assert.ok(sitemap.includes(`${canonicalOrigin}/consejos/cuidar-la-cadena/`));
console.log("PASS: rendered metadata, business identity, crawlable service links, service breadcrumbs, article and sitemap");
