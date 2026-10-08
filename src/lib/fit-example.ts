import { assessPose, type PosePoint } from "./bike-fit";

// Editorial illustrations, not prescribed fit targets. All displayed angles
// are computed from the very same landmarks used to draw the example.
const profiles: Record<string, { torso: number; elbow: number; standing?: boolean; note: string }> = {
  unknown: { torso: 45, elbow: 158, note: "Postura sentada de ejemplo para conocer la herramienta." },
  xc: { torso: 38, elbow: 160, note: "Ejemplo de pedaleo sentado, con el tronco inclinado hacia delante." },
  trail: { torso: 48, elbow: 150, note: "Ejemplo sentado para observar el pedaleo; no representa un descenso." },
  enduro: { torso: 35, elbow: 135, standing: true, note: "Ejemplo de pie, con brazos y piernas flexionados. La postura cambia con el terreno." },
  dh: { torso: 28, elbow: 125, standing: true, note: "Ejemplo de posición de ataque. No se compara con el rango de rodilla sentado." },
  road: { torso: 32, elbow: 160, note: "Ejemplo sentado con apoyo hacia delante. La posición de las manos cambia los ángulos." },
  gravel: { torso: 42, elbow: 155, note: "Ejemplo sentado con apoyo en manetas para observar la postura." },
  urban: { torso: 65, elbow: 165, note: "Ejemplo más erguido, con el manillar más alto y cercano." },
};

export function fitExample(discipline: string, posture?: "seated" | "standing") {
  const base = profiles[discipline] ?? profiles.unknown;
  const standing = posture ? posture === "standing" : !!base.standing;
  const seatedMTB = base.standing && !standing;
  const profile = { ...base, standing, torso: seatedMTB ? 46 : standing && !base.standing ? 42 : base.torso, elbow: seatedMTB ? 150 : standing && !base.standing ? 145 : base.elbow };
  const rad = Math.PI / 180;
  const hip = profile.standing ? [365, discipline === "dh" ? 165 : discipline === "enduro" ? 150 : 130] : [340, 200];
  const shoulder = [hip[0] + 112 * Math.cos(profile.torso * rad), hip[1] - 112 * Math.sin(profile.torso * rad)];
  const armDirection = standing ? 65 : discipline === "urban" ? 10 : 35;
  const elbow = [shoulder[0] + 84 * Math.cos(armDirection * rad), shoulder[1] + 84 * Math.sin(armDirection * rad)];
  const forearm = (armDirection - (180 - profile.elbow)) * rad;
  const wrist = [elbow[0] + 72 * Math.cos(forearm), elbow[1] + 72 * Math.sin(forearm)];
  const ankle = profile.standing ? [445, 290] : [414, 370];
  // Fixed femur/tibia lengths: changing posture must not change the rider's body.
  const dx = ankle[0] - hip[0], dy = ankle[1] - hip[1];
  const distance = Math.hypot(dx, dy);
  const offset = Math.sqrt(96 * 96 - distance * distance / 4);
  const knee = [(hip[0] + ankle[0]) / 2 + dy / distance * offset, (hip[1] + ankle[1]) / 2 - dx / distance * offset];
  const head = [shoulder[0] + 16, shoulder[1] - 43];
  const coordinates = [[0, ...head], [11, ...shoulder], [13, ...elbow], [15, ...wrist], [23, ...hip], [25, ...knee], [27, ...ankle], [29, ankle[0] - 5, ankle[1] + 5], [31, ankle[0] + 35, ankle[1] + 5]];
  const points: PosePoint[] = Array.from({ length: 33 }, () => ({ x: .5, y: .5, visibility: 1 }));
  for (const [id, x, y] of coordinates) points[id] = { x: x / 760, y: y / 430, visibility: 1 };
  const angles = assessPose(points, "left", 760, 430);
  const line = (coords: number[][]) => coords.map(p => p.join(",")).join(" ");
  const saddleY = standing ? 250 : 202;
  const dropBar = discipline === "road" || discipline === "gravel";
  const handlebar = dropBar
    ? `<path d="M${wrist[0] - 22} ${wrist[1]}h22q32 0 23 23q-5 15 -25 10"/><path d="M${wrist[0]} ${wrist[1]}l6 -12l13 4"/>`
    : `<path d="M${wrist[0] - 20} ${wrist[1]}h40"/>`;
  const rearAnkle = standing ? [345, 290] : [414, 200];
  const crankX = standing ? 415 : 434;
  const crankY = standing ? 295 : 290;
  const rearDistance = Math.hypot(rearAnkle[0] - hip[0], rearAnkle[1] - hip[1]);
  const rearOffset = Math.sqrt(96 * 96 - rearDistance * rearDistance / 4);
  const rearKnee = [(hip[0] + rearAnkle[0]) / 2 + (rearAnkle[1] - hip[1]) / rearDistance * rearOffset, (hip[1] + rearAnkle[1]) / 2 - (rearAnkle[0] - hip[0]) / rearDistance * rearOffset];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 430">
    <rect width="760" height="430" rx="12" fill="#111517"/>
    <rect x="32" y="25" width="696" height="375" rx="16" fill="none" stroke="#526064" stroke-dasharray="8 7"/>
    <g fill="none" stroke="#76858b" stroke-width="8" stroke-linejoin="round">
      <circle cx="230" cy="320" r="68"/><circle cx="600" cy="320" r="68"/>
      <path d="M230 320L340 218L${crankX} ${crankY}L230 320M340 218L550 217L${crankX} ${crankY}M550 217L600 320M340 218V${saddleY}M315 ${saddleY}H360"/>
      <polyline points="${line([[550, 217], [wrist[0] - 22, wrist[1]], wrist])}"/>${handlebar}
    </g>
    <g stroke="#c1cace" stroke-width="5" fill="none"><path d="M${crankX} ${crankY}L${ankle[0] + 20} ${ankle[1] + 5}M${crankX} ${crankY}L${rearAnkle[0] + 20} ${rearAnkle[1] + 5}"/><path d="M${ankle[0] + 8} ${ankle[1] + 5}h26M${rearAnkle[0] + 8} ${rearAnkle[1] + 5}h26"/></g>
    <polyline points="${line([hip, rearKnee, rearAnkle, [rearAnkle[0] + 35, rearAnkle[1] + 5]])}" fill="none" stroke="#975615" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    <g fill="none" stroke="#f28a17" stroke-width="15" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="${line([hip, shoulder, elbow, wrist])}"/><polyline points="${line([hip, knee, ankle, [ankle[0] + 35, ankle[1] + 5]])}"/><path d="M${shoulder.join(" ")}L${head.join(" ")}"/>
    </g>
    <circle cx="${head[0]}" cy="${head[1]}" r="23" fill="#f28a17"/>
    <path d="M${head[0] - 22} ${head[1] - 6}q20 -35 45 0" fill="#f5f5f2"/>
    <path d="M${head[0] + 12} ${head[1] - 3}h18" stroke="#fff" stroke-width="4"/>
    <g fill="#fff">${[hip, shoulder, elbow, wrist, knee, ankle].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="6"/>`).join("")}</g>
    <path d="M96 ${hip[1]}H${hip[0] - 25}" stroke="#72cec0" stroke-width="2" stroke-dasharray="5 5"/>
    <rect x="65" y="${hip[1] - 15}" width="32" height="30" rx="5" fill="#72cec0"/>
    <g fill="#e6ebed" font-family="Arial,sans-serif" font-size="16"><text x="50" y="52">${standing ? "De pie · pedales a nivel" : "Sentado · pedal cercano abajo"}</text><text x="50" y="419">Guía visual · Adapta la postura a tu cuerpo</text></g>
  </svg>`;
  return { points, angles, standing: !!profile.standing, note: profile.standing ? "Ejemplo de pie con pedales a nivel. Sirve para observar la postura; no para ajustar la altura del sillín." : base.standing ? "Ejemplo sentado para revisar el pedaleo. La posición de ataque se observa por separado." : profile.note, image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` };
}
