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
