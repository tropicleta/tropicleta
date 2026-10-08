import assert from "node:assert/strict";
import { fitExample } from "../src/lib/fit-example";
import { LiveFitFilter } from "../src/lib/fit-live";

const points = fitExample("road").points;
const filter = new LiveFitFilter();
assert.equal(filter.update(points, "left", 760, 430).stable, false);
assert.equal(filter.update(points, "left", 760, 430).stable, false);
assert.equal(filter.update(points, "left", 760, 430).stable, true);
const moved = points.map((point, index) => index === 25 ? { ...point, x: point.x + .07 } : { ...point });
assert.equal(filter.update(moved, "left", 760, 430).stable, false);
const hidden = points.map((point, index) => index === 25 ? { ...point, visibility: .1 } : { ...point });
const invalid = filter.update(hidden, "left", 760, 430);
assert.equal(invalid.stable, false);
assert.equal(invalid.points[25].visibility, .1); // Confidence must never be averaged up.
assert.deepEqual(filter.update(points, "left", 760, 430).points, points); // No stale pose after a gap.
assert.equal(filter.update(points, "left", 1520, 860).stable, false);
assert.equal(filter.update([], "left", 760, 430).stable, false);
filter.reset();
assert.equal(filter.update(points, "left", 760, 430).stable, false);
console.log("Cámara: estabilidad, movimiento, confianza actual y reinicio de sesión OK.");
