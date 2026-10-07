export type PosePoint = { x: number; y: number; visibility?: number; presence?: number };
export type BikeSide = "left" | "right";
export const sidePoints = {
  left: [11, 13, 15, 23, 25, 27, 29, 31],
  right: [12, 14, 16, 24, 26, 28, 30, 32],
} as const;

/** Planar angles must use pixels: normalized x/y have different scales. */
export function jointAngle(a: PosePoint, b: PosePoint, c: PosePoint, width: number, height: number): number | null {
  const u = [(a.x - b.x) * width, (a.y - b.y) * height];
  const v = [(c.x - b.x) * width, (c.y - b.y) * height];
  const length = Math.hypot(...u) * Math.hypot(...v);
  if (length < 1 || !Number.isFinite(length)) return null;
  return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / length))) * 180 / Math.PI;
}

export function assessPose(points: PosePoint[], side: BikeSide, width: number, height: number) {
  const ids = [0, ...sidePoints[side]];
  const selected = ids.map((id) => points[id]);
  if (selected.some((p) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y)))
    return { valid: false as const, message: "No detectamos el cuerpo completo. Incluye cabeza, manos y ambos pies." };
  if (selected.some((p) => p.x < .025 || p.x > .975 || p.y < .025 || p.y > .975))
    return { valid: false as const, message: "El cuerpo está cortado o muy cerca del borde. Aleja la cámara." };
  // This pinned JS runtime exposes visibility only; presence is optional.
  if (selected.some((p) => Math.min(p.visibility ?? 0, p.presence ?? 1) < .75))
    return { valid: false as const, message: "Articulaciones poco visibles. Mejora la luz, evita ropa holgada y elige el lado cercano a la cámara." };
  if (Math.max(...selected.map((p) => p.y)) - Math.min(...selected.map((p) => p.y)) < .3)
    return { valid: false as const, message: "El ciclista ocupa muy poco del encuadre. Acerca la cámara sin cortar el cuerpo ni la bicicleta." };
  const [s, e, w, h, k, a] = sidePoints[side].map((id) => points[id]);
  if ([[s, e], [e, w], [s, h], [h, k], [k, a]].some(([p, q]) => Math.hypot((p.x - q.x) * width, (p.y - q.y) * height) < 12))
    return { valid: false as const, message: "Segmentos demasiado pequeños o superpuestos. Revisa la vista lateral." };
  const knee = jointAngle(h, k, a, width, height);
  const hip = jointAngle(s, h, k, width, height);
  const elbow = jointAngle(s, e, w, width, height);
  if (knee === null || hip === null || elbow === null)
    return { valid: false as const, message: "No podemos calcular ángulos con este encuadre." };
  return {
    valid: true as const, message: "Articulaciones visibles. La confianza del modelo no garantiza exactitud del ángulo.",
    knee: 180 - knee, hip, elbow,
    torso: Math.atan2(Math.abs((s.y - h.y) * height), Math.abs((s.x - h.x) * width)) * 180 / Math.PI,
  };
}
