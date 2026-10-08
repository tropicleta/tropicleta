import type { SagReference } from "@/data/sag-references";

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
export function suggestSag(discipline: string, rear: boolean, reference?: SagReference) {
  if (reference?.range) {
    const [min, max] = reference.range;
    return { value: (min + max) / 2, range: min === max ? `${min} %` : `${min}–${max} %`, source: `Referencia oficial de ${reference.brand} ${reference.label}; ${min === max ? "valor inicial del fabricante" : "el punto medio es una propuesta de esta calculadora"}, no un ajuste óptimo garantizado`, verified: true };
  }
  if (reference) return { value: rear ? 30 : 20, range: null, source: reference.note, verified: false };
  const ranges: Record<string, [number, number]> = { xc: [20, 25], trail: [25, 30], enduro: [25, 35], dh: [30, 40] };
  const range = ranges[discipline];
  if (range) return { value: (range[0] + range[1]) / 2, range: `${range[0]}–${range[1]} %`, source: "Escenario educativo basado en SIMPLON; el rango general no distingue horquilla y amortiguador. Confirma el objetivo de este componente antes de ajustar", verified: false };
  return { value: rear ? 30 : 20, range: null, source: "Ejemplo inicial; sin referencia específica para tu suspensión", verified: false };
}
