import assert from "node:assert/strict";
import { bookingServiceGroups } from "../src/lib/booking-service-groups";

const base = { vehicleType: "bicicleta", vehicleDetails: "Bicicleta 1 · MTB aro 29", serviceNames: ["Bicicleta 1 · Frenos ×1", "Bicicleta 1 · Cambios ×1"] };
assert.deepEqual(bookingServiceGroups(base), [{ label: "Bicicleta 1", details: "MTB aro 29", services: ["Frenos ×1", "Cambios ×1"] }]);

const vehicles = [
  { label: "Bicicleta 1", details: "MTB aro 29", calculation: { lines: [{ name: "Frenos", quantity: 1 }, { name: "Cambios", quantity: 1 }] } },
  { label: "Bicicleta 2", details: "Ruta", calculation: { lines: [{ name: "Centrado", quantity: 2 }] } },
  { label: "Scooter eléctrico 3", details: "", calculation: { lines: [{ name: "Neumático", quantity: 1 }] } },
];
assert.deepEqual(bookingServiceGroups({ ...base, quoteSnapshot: { vehicles } }), [
  { label: "Bicicleta 1", details: "MTB aro 29", services: ["Frenos ×1", "Cambios ×1"] },
  { label: "Bicicleta 2", details: "Ruta", services: ["Centrado ×2"] },
  { label: "Scooter eléctrico 3", details: "", services: ["Neumático ×1"] },
]);
// Invalid snapshots must not silently drop services or vehicles.
assert.deepEqual(bookingServiceGroups({ ...base, quoteSnapshot: { vehicles: [...vehicles, null] } }), bookingServiceGroups(base));
assert.deepEqual(bookingServiceGroups({ ...base, vehicleType: "scooter", vehicleDetails: "Modelo urbano", serviceNames: ["Pinchazo"] }), [{ label: "Scooter eléctrico", details: "Modelo urbano", services: ["Pinchazo"] }]);
assert.deepEqual(bookingServiceGroups({ ...base, serviceNames: ["Bicicleta 1 · Frenos ×1", "Scooter 1 · Cámara ×1", "Bicicleta 1 · Cambios ×1"], vehicleDetails: null }), [
  { label: "Bicicleta 1", details: "", services: ["Frenos ×1", "Cambios ×1"] },
  { label: "Scooter 1", details: "", services: ["Cámara ×1"] },
]);
console.log("Agrupación de servicios: correcta para varios vehículos, reservas antiguas y datos incompletos.");
