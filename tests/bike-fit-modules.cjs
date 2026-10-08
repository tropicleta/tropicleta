const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const source = fs.readFileSync("src/lib/bike-fit-modules.ts", "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(code, { exports: exportsObject });
const { bikeFitModule } = exportsObject;
for (const discipline of ["unknown", "road", "gravel", "urban", "xc", "trail", "enduro", "dh"]) {
  const module = bikeFitModule(discipline);
  assert.equal(module.postures.includes(module.posture), true);
  assert.equal(module.metrics.length, 4);
  assert.equal(new Set(module.metrics).size, 4);
  for (const posture of module.postures) {
    const selected = bikeFitModule(discipline, posture);
    assert.equal(selected.kneeReference, posture === "seated");
    assert.equal(selected.metrics[0], posture === "seated" ? "knee" : "elbow");
  }
}
assert.equal(bikeFitModule("dh", "seated").posture, "standing");
assert.equal(bikeFitModule("road", "standing").posture, "seated");
assert.equal(bikeFitModule("enduro", "seated").kneeReference, true);
assert.equal(bikeFitModule("enduro").kneeReference, false);
assert.notEqual(bikeFitModule("urban").interpretation, bikeFitModule("road").interpretation);
assert.equal(bikeFitModule("missing").posture, "seated");
console.log("Módulos: disciplinas, recorridos, prioridades y límites de comparación OK.");
