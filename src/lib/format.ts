/** Formato CLP igual al original: $50.000 */
export function formatCLP(value: number): string {
  return "$" + Math.round(value).toLocaleString("es-CL");
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value + (value.length === 10 ? "T12:00:00" : "")) : value;
  return d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
}

export function formatDateTime(value: Date): string {
  return value.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" });
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Normaliza un celular chileno a 569XXXXXXXX. Devuelve null si no es válido. */
export function normalizeChileanPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("56")) digits = digits.slice(2);
  if (digits.length === 8) digits = "9" + digits;
  if (digits.length !== 9 || !digits.startsWith("9")) return null;
  return "56" + digits;
}

export function displayPhone(normalized: string): string {
  const d = normalized.replace(/^56/, "");
  return `+56 ${d[0]} ${d.slice(1, 5)} ${d.slice(5)}`;
}

/** Código corto legible, p. ej. TP-7K3M9Q */
export function shortCode(prefix: string, length = 6): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${prefix}-${out}`;
}

export function paymentLabel(method: string): string {
  return method === "webpay" ? "Pago con tarjeta" : method === "mercadopago" ? "Mercado Pago" : method;
}

export function deliveryLabel(order: { deliveryMethod: string; commune?: string | null }): string {
  return order.deliveryMethod === "retiro" ? "Retiro en taller" : `Despacho · ${order.commune ?? ""}`;
}
