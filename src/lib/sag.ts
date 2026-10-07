/** Length is fork travel or shock stroke, never rear wheel travel. */
export function calculateSag(length: number, target: number, measured?: number) {
  if (!Number.isFinite(length) || length <= 0) return { error: "Ingresa un recorrido o carrera mayor que 0 mm." };
  if (!Number.isFinite(target) || target <= 0 || target >= 100) return { error: "El objetivo debe ser mayor que 0 y menor que 100 %." };
  if (measured !== undefined && (!Number.isFinite(measured) || measured < 0 || measured > length)) return { error: "El hundimiento debe estar entre 0 y el recorrido o carrera ingresado." };
  return { targetMm: length * target / 100, measuredPercent: measured === undefined ? undefined : measured / length * 100, differenceMm: measured === undefined ? undefined : measured - length * target / 100 };
}

export function parseSagInput(value: string): number {
  return value.trim() === "" ? NaN : Number(value.replace(",", "."));
}

/** General SIMPLON discipline ranges are provisional; a model's manual wins. */
export function suggestSag(discipline: string, rear: boolean, foxModel: boolean) {
  if (foxModel) return { value: rear ? 27.5 : 17.5, range: rear ? "25–30 %" : "15–20 %", source: "Manual FOX del modelo seleccionado" };
  const ranges: Record<string, [number, number]> = { xc: [20, 25], trail: [25, 30], enduro: [25, 35], dh: [30, 40] };
  const range = ranges[discipline];
  if (range) return { value: (range[0] + range[1]) / 2, range: `${range[0]}–${range[1]} %`, source: "Referencia general SIMPLON por disciplina; confirma con el manual de tu modelo" };
  return { value: rear ? 30 : 20, range: null, source: "Ejemplo inicial; sin referencia específica para tu suspensión" };
}
