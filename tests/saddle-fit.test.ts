import assert from "node:assert/strict";
import { assessSaddlePose } from "../src/lib/bike-fit";
import { fitExample } from "../src/lib/fit-example";
const points = fitExample("unknown", "seated").points;
assert.equal(assessSaddlePose(points, "left", 760, 430).valid, true);
const hiddenArms = points.map((point, id) => [11, 13, 15].includes(id) ? { ...point, visibility: .1 } : { ...point });
assert.equal(assessSaddlePose(hiddenArms, "left", 760, 430).valid, true);
for (const id of [0, 23, 25, 27]) {
  assert.equal(assessSaddlePose(points.map((point, index) => index === id ? { ...point, visibility: .1 } : point), "left", 760, 430).valid, false);
}
assert.equal(assessSaddlePose([], "left", 760, 430).valid, false);
assert.equal(assessSaddlePose(points.map((point, id) => id === 27 ? { ...point, y: .99 } : point), "left", 760, 430).valid, false);
console.log("Sillín: validación de la pierna, encuadre y exclusión de brazos irrelevantes OK.");
