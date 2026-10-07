export const cyclingDisciplines = [
  { id: "unknown", label: "Estoy explorando / no lo sé", sag: null, fit: "Empieza con una foto de perfil, en tu posición habitual sobre una bicicleta estable. Los ángulos te ayudan a conocer la postura, sin definir una posición ideal." },
  { id: "xc", label: "MTB · XC / maratón", sag: "20–25 %", fit: "Usa tu posición habitual de pedaleo sentado, con las manos en el manillar. La postura en una subida o de pie es distinta a la captura estática de referencia." },
  { id: "trail", label: "MTB · trail / all mountain", sag: "25–30 %", fit: "Revisa primero tu posición sentado. La postura de pie para descender no se compara con la referencia estática de rodilla de esta herramienta." },
  { id: "enduro", label: "MTB · enduro", sag: "25–35 %", fit: "La captura sentado ayuda a observar el pedaleo. No representa la posición de ataque ni el movimiento del cuerpo en descensos." },
  { id: "dh", label: "MTB · downhill / freeride", sag: "30–40 %", fit: "Puedes observar ángulos, pero la referencia de rodilla sentado no evalúa la postura de pie para descender. No interpretes ese rango como un objetivo de downhill." },
  { id: "road", label: "Ruta", sag: null, fit: "Mantén las manos en la posición que quieres observar y repite siempre con el mismo apoyo. Cambiar entre manetas, parte alta y parte baja del manillar cambia la postura." },
  { id: "gravel", label: "Gravel", sag: null, fit: "Usa tu apoyo habitual en el manillar y el mismo encuadre al repetir. La herramienta no evalúa cómo responde tu postura a las vibraciones o al terreno." },
  { id: "urban", label: "Urbano / recreativo", sag: null, fit: "Fotografía tu postura habitual con las manos en el manillar. Una posición más erguida no se considera incorrecta por sí sola; no hay un objetivo universal de tronco." },
] as const;
