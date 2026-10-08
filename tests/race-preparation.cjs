const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
function load(path) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
  return exports;
}
const { raceBookingNotes, racePreparationChecks } = load("src/data/race-preparation.ts");
const { officialServices, excludedServiceSlugs } = load("src/data/official-services.ts");
assert.equal(new Set(racePreparationChecks.map(item => item.id)).size, racePreparationChecks.length);
for (const item of racePreparationChecks) if (item.service) {
  assert.ok(officialServices.some(service => service[1] === item.service));
  assert.equal(excludedServiceSlugs.includes(item.service), false);
}
assert.ok(raceBookingNotes("2026-10-20", "brakes,wheels,unknown").includes("2026-10-20"));
assert.ok(raceBookingNotes("2026-10-20", "brakes,wheels,unknown").includes("Frenos, Neumáticos y ruedas"));
assert.equal(raceBookingNotes(undefined, "unknown,<script>").includes("<script>"), false);
for (const date of ["2026-02-31", "2026-13-01", "hello", "2026-1-2"]) assert.ok(raceBookingNotes(date).includes("por indicar"));
assert.ok(raceBookingNotes("2028-02-29").includes("2028-02-29"));
assert.ok(raceBookingNotes().includes("Fecha deseada para la entrega"));
console.log("Carreras: servicios vigentes, fechas y contexto de solicitud OK.");
