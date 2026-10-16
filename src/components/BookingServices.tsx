import { bookingServiceGroups } from "@/lib/booking-service-groups";

export function BookingServices({ booking }: { booking: Parameters<typeof bookingServiceGroups>[0] }) {
  return <div className="tp-booking-services">{bookingServiceGroups(booking).map((group, index) => <div key={index}>
    <strong>{group.label}</strong>
    {group.details && <div className="tp-hint">{group.details}</div>}
    <ul>{group.services.map((service, i) => <li key={i}>{service}</li>)}</ul>
  </div>)}</div>;
}
