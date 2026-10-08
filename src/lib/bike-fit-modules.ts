export type FitPosture = "seated" | "standing";
export type FitMetric = "knee" | "hip" | "elbow" | "torso";
type Profile = { postures: FitPosture[]; initial: FitPosture; hands: string; focus: string };
const profiles: Record<string, Profile> = {
  unknown: { postures: ["seated"], initial: "seated", hands: "Apoya las manos como cuando pedaleas habitualmente.", focus: "Conocer tu posición sentada" },
  road: { postures: ["seated"], initial: "seated", hands: "Elige un apoyo: manetas, parte alta o parte baja del manillar. Mantén el mismo al repetir.", focus: "Pedaleo y apoyo en el manillar" },
  gravel: { postures: ["seated"], initial: "seated", hands: "Usa tu apoyo habitual en el manillar. Repite la toma con las manos en el mismo lugar.", focus: "Pedaleo con tu apoyo habitual" },
  urban: { postures: ["seated"], initial: "seated", hands: "Siéntate como al circular habitualmente, con las manos en el manillar.", focus: "Pedaleo y postura cotidiana" },
  xc: { postures: ["seated"], initial: "seated", hands: "Usa tu postura habitual de pedaleo sentado, con las manos en los puños.", focus: "Pedaleo sentado en MTB" },
  trail: { postures: ["seated", "standing"], initial: "seated", hands: "Mantén las manos en los puños y el mismo apoyo al repetir.", focus: "Pedaleo o postura de manejo" },
  enduro: { postures: ["standing", "seated"], initial: "standing", hands: "Mantén las manos en los puños. Para pedalear sentado, elige el otro recorrido.", focus: "Manejo de pie o pedaleo sentado" },
  dh: { postures: ["standing"], initial: "standing", hands: "Manos en los puños y pedales a nivel, con la bicicleta firmemente sostenida.", focus: "Observación de manejo de pie" },
};

export function bikeFitModule(discipline: string, requested?: FitPosture) {
  const profile = profiles[discipline] ?? profiles.unknown;
  const posture = requested && profile.postures.includes(requested) ? requested : profile.initial;
  const standing = posture === "standing";
  return {
    ...profile, posture, standing,
    title: standing ? "Manejo de pie" : "Pedaleo sentado",
    description: standing ? "Observa cómo se relacionan brazos, tronco y piernas en una postura de pie. No evalúa la altura del sillín ni el control durante un descenso." : "Mide la rodilla en una toma estática y observa tu apoyo en el manillar. No calcula medidas de componentes.",
    preparation: standing ? "Pedales a nivel, cuerpo de pie y bicicleta estable. Pide ayuda para sostenerla; no intentes mantener el equilibrio mientras usas el teléfono." : "Sentado, calzado habitual y pedal cercano en su punto más bajo. No fuerces el tobillo ni la pierna para alcanzar una cifra.",
    metrics: (standing ? discipline === "dh" ? ["elbow", "torso", "knee", "hip"] : ["elbow", "knee", "torso", "hip"] : discipline === "road" || discipline === "gravel" || discipline === "urban" ? ["knee", "torso", "elbow", "hip"] : ["knee", "hip", "torso", "elbow"]) as FitMetric[],
    kneeReference: !standing,
    interpretation: standing ? "Los ángulos describen esta imagen de pie, no tu equilibrio ni tu habilidad en el terreno. Repite la misma postura para observar cambios; no hay objetivos universales de codo o tronco ni recomendaciones de manetas o potencia." : discipline === "road" || discipline === "gravel" ? "Cambiar el apoyo en el manillar cambia el tronco y el codo. Compara sólo tomas con el mismo apoyo; estos ángulos no determinan qué longitud de potencia necesitas." : discipline === "urban" ? "Una postura más erguida no es incorrecta por sí sola. Observa cambios entre tomas iguales; no copies el ángulo de tronco del dibujo." : "Esta toma describe pedaleo sentado. No representa una subida, un descenso ni la postura de pie; repite el mismo apoyo y encuadre antes de interpretar cambios.",
  };
}
