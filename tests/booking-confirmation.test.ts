import assert from "node:assert/strict";
import { test } from "node:test";
import { bookingConfirmation } from "../src/lib/booking-confirmation";
import { formatCLP } from "../src/lib/format";
import { applyPromotion } from "../src/lib/promotion";
import { serviceQuote } from "../src/lib/service-quote";
import { whatsappUrl } from "../src/lib/whatsapp";

const lines = [
  { slug: "pack", name: "Mantención completa", quantity: 2, price: 60000, priceFrom: false, included: ["Ajuste interno"] },
  { slug: "extra", name: "Tubeless", quantity: 1, price: 12000, priceFrom: true },
];
const snapshot = {
  vehicles: [{ label: "Bicicleta 1", details: "Trek", calculation: { lines } }],
  ...applyPromotion(serviceQuote(lines, true, "Copiapó", "delivery", true), { code: "TALLER15", percent: 15 }),
};
const booking = {
  code: "TP-PRUEBA", name: "Ana Pérez", preferredDate: "2026-12-02", timeSlot: "manana",
  vehicleType: "bicicleta", vehicleDetails: "Trek", serviceNames: ["Mantención completa ×2", "Tubeless ×1"],
  pickup: true, pickupCommune: "Copiapó", pickupAddress: "Calle 1",
  notes: "Incluidos: Ajuste interno",
};

test("usa precios guardados y comparte el mismo resumen sin expandir paquetes", () => {
  const summary = bookingConfirmation({
    ...booking,
    quoteSnapshot: { ...snapshot, transportMode: "delivery", customerNotes: "Primera línea\nSegunda línea" },
  });
  const url = new URL(whatsappUrl(summary.message));
  assert.equal(url.origin + url.pathname, "https://wa.me/56976614443");
  assert.equal(url.searchParams.get("text"), summary.message);
  assert.deepEqual(summary.groups[0].services, [
    { label: "Mantención completa ×2", value: formatCLP(120000) },
    { label: "Tubeless ×1", value: "Desde " + formatCLP(12000) },
  ]);
  assert.equal(summary.total, "Desde " + formatCLP(124200));
  for (const text of ["TP-PRUEBA", "Ana Pérez", "Bicicleta 1 · Trek", "Código TALLER15", "Solo entrega", "mañana", "Calle 1, Copiapó", "Observaciones: Primera línea\nSegunda línea"]) {
    assert.ok(summary.message.includes(text), text);
  }
  assert.doesNotMatch(summary.message, /Ajuste interno/);
});

test("recupera transporte y observaciones de una reserva con el snapshot anterior", () => {
  const notes = [
    "Bicicleta 1 · Trek: Mantención completa ×2 · Incluidos: Ajuste interno",
    `Bicicleta 1: Mantención completa ×2: ${formatCLP(120000)}; Tubeless ×1: Desde ${formatCLP(12000)}; Subtotal de servicios: ${formatCLP(132000)}; Código TALLER15, descuento 15% en servicios: -${formatCLP(19800)}; Solo entrega: ${formatCLP(12000)}; Total estimado: ${formatCLP(124200)}; Sujeto a diagnóstico y confirmación.`,
    "Llamar al llegar",
  ].join("\n");
  const summary = bookingConfirmation({ ...booking, notes, quoteSnapshot: snapshot });
  assert.match(summary.message, /Solo entrega/);
  assert.match(summary.message, /Observaciones: Llamar al llegar/);
  assert.doesNotMatch(summary.message, /Ajuste interno/);
});

test("muestra servicios históricos sin asignar valores que no están guardados", () => {
  const summary = bookingConfirmation({ ...booking, pickup: false });
  assert.equal(summary.total, "Consultar con el taller");
  assert.match(summary.message, /Mantención completa ×2/);
  assert.doesNotMatch(summary.message, /Dirección|Ajuste interno/);
});
