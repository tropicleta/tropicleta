export const racePreparationChecks = [
  { id: "brakes", title: "Frenos", detail: "Comprueba que ambos frenos respondan. Si hay pérdida de frenado o fugas, solicita revisión antes de salir.", service: "ajuste-frenos-cambios" },
  { id: "wheels", title: "Neumáticos y ruedas", detail: "Revisa daños, presión y fijación de ruedas según el fabricante. Anota pérdidas de aire o roces.", service: "tubeless-completo" },
  { id: "drivetrain", title: "Cambios y cadena", detail: "Observa saltos de cadena, cambios imprecisos y desgaste. Anota cuándo aparece el problema.", service: "ajuste-de-cambios" },
  { id: "suspension", title: "Suspensión y configuración", detail: "Consulta el manual y anota presión, SAG y diales actuales. Una guía no reemplaza un servicio por desgaste o avería.", service: "servicio-completo-horquilla" },
  { id: "supports", title: "Dirección y fijaciones", detail: "Comprueba holguras y fijaciones siguiendo el manual. No improvises pares de apriete.", service: "mantencion-de-direccion" },
  { id: "kit", title: "Kit y prueba previa", detail: "Prepara tu kit de reparación y comprueba el funcionamiento en una salida de prueba antes de competir.", service: null },
] as const;

export function raceBookingNotes(date?: string, requestedChecks?: string) {
  const timestamp = date ? Date.parse(date) : NaN;
  const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date ? date : undefined;
  const requested = new Set((requestedChecks ?? "").split(","));
  const checks = racePreparationChecks.filter(item => requested.has(item.id)).map(item => item.title);
  return `Preparación para carrera.\nFecha de la carrera: ${validDate ?? "por indicar"}.\nBicicleta y modalidad: \nSíntomas o trabajos que necesito: ${checks.join(", ")}\nFecha deseada para la entrega: `;
}
