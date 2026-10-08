/** Static knee reference only. The 5° amber band is a UI proximity cue,
 * not a validated biomechanical tolerance or a measurement of progress. */
export function kneeFeedback(angle: number | null) {
  if (angle === null || !Number.isFinite(angle)) return {
    state: "pending", color: "#82bddd", title: "Primero confirma la toma",
    action: "Confirma una toma de perfil, sentado, sin pedalear y con el pedal visible abajo.",
  };
  const distance = Math.max(25 - angle, angle - 35, 0);
  const state = distance === 0 ? "inside" : distance <= 5 ? "near" : "far";
  return {
    state, color: state === "inside" ? "#79dfb5" : state === "near" ? "#ffd166" : "#ff8282",
    title: state === "inside" ? "La altura se ve adecuada" : angle < 25 ? "El sillín parece alto" : "El sillín parece bajo",
    action: state === "inside" ? "Mantén esta configuración y repite la toma para comprobarla. El verde describe la rodilla; no confirma el ajuste completo."
      : angle < 25 ? "La pierna aparece más extendida. Repite la toma sin estirar el tobillo. Si se confirma, revisa si el sillín está demasiado alto antes de probar un cambio pequeño."
      : "La pierna aparece más flexionada. Repite la toma con el pedal abajo y el apoyo habitual del pie. Si se confirma, revisa si el sillín está demasiado bajo antes de probar un cambio pequeño.",
  };
}
