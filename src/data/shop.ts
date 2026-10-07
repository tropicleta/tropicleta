/**
 * Tarifas fijas de reparto local confirmadas por Tropicleta.
 * Se recalculan siempre en el servidor (nunca se confía en el total del cliente).
 */
export const deliveryCommunes = ["Tierra Amarilla", "Paipote", "Copiapó"] as const;
export type DeliveryCommune = (typeof deliveryCommunes)[number];

export const shopRules = {
  pickupLabel: "Retiro en el taller (Tierra Amarilla, con coordinación previa)",
  deliveryLabel: "Despacho a domicilio",
  /** Tabla compartida por la interfaz y el cálculo del servidor. */
  shippingByCommune: {
    "Tierra Amarilla": 3000,
    Paipote: 5000,
    Copiapó: 10000,
  } satisfies Record<DeliveryCommune, number>,
  maxQtyPerItem: 10,
};

export function shippingCost(method: "retiro" | "despacho", commune?: string | null): number {
  if (method === "retiro") return 0;
  const cost = shopRules.shippingByCommune[commune as DeliveryCommune];
  if (cost === undefined) throw new Error("Comuna fuera de cobertura");
  return cost;
}
