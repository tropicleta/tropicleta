import assert from "node:assert/strict";
import { assessPose, jointAngle, type PosePoint } from "../src/lib/bike-fit";
import { fitExample } from "../src/lib/fit-example";
import { cyclingDisciplines } from "../src/data/cycling-disciplines";

// A rectangular image must preserve the right angle in pixel coordinates.
assert.equal(jointAngle({ x: .1, y: .1 }, { x: .1, y: .5 }, { x: .5, y: .5 }, 1600, 900), 90);
assert.equal(jointAngle({ x: .1, y: .1 }, { x: .1, y: .1 }, { x: .5, y: .5 }, 1600, 900), null);
const points: PosePoint[] = Array.from({ length: 33 }, () => ({ x: .5, y: .5, visibility: .99, presence: .99 }));
points[0] = { ...points[0], y: .1 };
for (const [id, x, y] of [[11,.3,.25], [13,.5,.3], [15,.7,.35], [23,.3,.5], [25,.5,.65], [27,.55,.85], [29,.5,.9], [31,.65,.9]]) {
  points[id] = { ...points[id], x, y };
}
assert.equal(assessPose(points, "left", 1600, 900).valid, true);
// MediaPipe 0.10.32 JS returns visibility but no per-landmark presence.
assert.equal(assessPose(points.map(({ presence: _, ...p }) => p), "left", 1600, 900).valid, true);
assert.equal(assessPose([], "left", 1600, 900).valid, false);
points[25].visibility = .5;
assert.equal(assessPose(points, "left", 1600, 900).valid, false);
points[25].visibility = .99;
points[31].x = .99;
assert.equal(assessPose(points, "left", 1600, 900).valid, false);
points[31].x = .65;
points[0].presence = .4;
assert.equal(assessPose(points, "left", 1600, 900).valid, false);
points[0].presence = .99;
points[25].x = NaN;
assert.equal(assessPose(points, "left", 1600, 900).valid, false);
console.log("Bike fitting: geometría, encuadre y confianza verificados.");

const segment = (sample: PosePoint[], a: number, b: number) => Math.hypot((sample[a].x - sample[b].x) * 760, (sample[a].y - sample[b].y) * 430);
for (const discipline of cyclingDisciplines) {
  for (const posture of ["seated", "standing"] as const) {
    const example = fitExample(discipline.id, posture);
    assert.equal(example.angles.valid, true, `${discipline.id}/${posture}: landmarks must be visible`);
    assert.equal(example.standing, posture === "standing");
    assert.ok(Math.abs(segment(example.points, 23, 25) - 96) < .001);
    assert.ok(Math.abs(segment(example.points, 25, 27) - 96) < .001);
    assert.ok(Math.abs(segment(example.points, 23, 11) - 112) < .001);
    if (posture === "seated" && example.angles.valid) assert.ok(example.angles.knee >= 25 && example.angles.knee <= 35);
  }
}
assert.notEqual(fitExample("road").image, fitExample("urban").image);
console.log("Ejemplos por disciplina: geometría coherente y proporciones constantes.");
