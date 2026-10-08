import { assessSaddlePose, type BikeSide, type PosePoint } from "./bike-fit";

/** Independent implementation inspired by the reference project's temporal
 * filtering. Current confidence is never averaged or carried across gaps. */
export class LiveFitFilter {
  private previous: PosePoint[] = [];
  private knees: number[] = [];
  private key = "";
  reset() { this.previous = []; this.knees = []; this.key = ""; }

  update(raw: PosePoint[], side: BikeSide, width: number, height: number) {
    const key = `${side}/${width}/${height}`;
    if (key !== this.key) { this.reset(); this.key = key; }
    const measured = assessSaddlePose(raw, side, width, height);
    if (!measured.valid) { this.reset(); return { points: raw, stable: false }; }
    const points = raw.map((point, index) => {
      const previous = this.previous[index];
      return previous && Number.isFinite(previous.x) && Number.isFinite(previous.y)
        ? { ...point, x: point.x * .65 + previous.x * .35, y: point.y * .65 + previous.y * .35 }
        : { ...point };
    });
    this.previous = points;
    this.knees.push(measured.knee);
    if (this.knees.length > 3) this.knees.shift();
    // A stable reading is a display condition, not pedal-phase detection or
    // a guarantee of accuracy. Use raw angles so filtering cannot hide motion.
    const stable = this.knees.length === 3 && Math.max(...this.knees) - Math.min(...this.knees) <= 3;
    return { points, stable };
  }
}
