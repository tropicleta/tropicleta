import assert from "node:assert/strict";
import { kneeFeedback } from "../src/lib/fit-feedback";

for (const angle of [25, 30, 35]) assert.equal(kneeFeedback(angle).state, "inside");
for (const angle of [20, 24.99, 35.01, 40]) assert.equal(kneeFeedback(angle).state, "near");
for (const angle of [19.99, 40.01, 80]) assert.equal(kneeFeedback(angle).state, "far");
for (const angle of [null, NaN, Infinity]) assert.equal(kneeFeedback(angle).state, "pending");
assert.match(kneeFeedback(15).action, /más extendida/);
assert.match(kneeFeedback(45).action, /más flexionada/);
assert.match(kneeFeedback(30).action, /no confirma/);
console.log("Referencia estática: límites, datos ausentes y orientación de ajuste OK.");
