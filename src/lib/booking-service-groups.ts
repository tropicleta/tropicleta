type BookingSummary = {
  serviceNames: string[];
  vehicleType: string;
  vehicleDetails: string | null;
  quoteSnapshot?: unknown;
};
export type BookingServiceGroup = { label: string; details: string; services: string[] };

/** Use the saved quote so later catalog edits cannot change an existing request. */
export function bookingServiceGroups(booking: BookingSummary): BookingServiceGroup[] {
  const snapshot = booking.quoteSnapshot as { vehicles?: unknown } | null;
  if (Array.isArray(snapshot?.vehicles) && snapshot.vehicles.length) {
    const groups: BookingServiceGroup[] = [];
    for (const raw of snapshot.vehicles) {
      const vehicle = raw as { label?: unknown; details?: unknown; calculation?: { lines?: unknown } } | null;
      if (!vehicle || typeof vehicle.label !== "string" || !Array.isArray(vehicle.calculation?.lines) || !vehicle.calculation.lines.length) break;
      const services = vehicle.calculation.lines.flatMap((rawLine: unknown) => {
        const line = rawLine as { name?: unknown; quantity?: unknown } | null;
        return line && typeof line.name === "string" && typeof line.quantity === "number" && Number.isInteger(line.quantity) && line.quantity > 0
          ? [`${line.name} ×${line.quantity}`] : [];
      });
      if (services.length !== vehicle.calculation.lines.length) break;
      groups.push({ label: vehicle.label, details: typeof vehicle.details === "string" ? vehicle.details : "", services });
    }
    if (groups.length === snapshot.vehicles.length) return groups;
  }

  // Older requests may only have the flat list, with or without vehicle prefixes.
  const labels: Record<string, string> = { bicicleta: "Bicicleta", electrica: "Bicicleta eléctrica", scooter: "Scooter eléctrico" };
  const fallback = labels[booking.vehicleType] ?? booking.vehicleType;
  const groups = new Map<string, BookingServiceGroup>();
  for (const name of booking.serviceNames) {
    const match = name.match(/^(.+? \d+) · (.+)$/);
    const label = match?.[1] ?? fallback;
    if (!groups.has(label)) groups.set(label, { label, details: "", services: [] });
    groups.get(label)!.services.push(match?.[2] ?? name);
  }
  for (const group of groups.values()) {
    const details = booking.vehicleDetails ?? "";
    group.details = details.startsWith(`${group.label} · `)
      ? details.slice(group.label.length + 3).split("; ")[0]
      : groups.size === 1 && !details.startsWith(group.label) ? details : "";
  }
  return [...groups.values()];
}
