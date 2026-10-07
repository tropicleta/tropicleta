import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Solicitud recibida", robots: { index: false } };

type Props = { searchParams: Promise<{ codigo?: string }> };

export default async function GraciasAgendarPage({ searchParams }: Props) {
  const { codigo } = await searchParams;
  if (!codigo) notFound();
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.code, codigo)).limit(1);
  if (!b) notFound();

  const slot = b.timeSlot === "manana" ? "mañana" : "tarde";

  return (
    <section className="tp-hero tp-page-hero">
      <div className="tp-shell tp-two-col" style={{ position: "relative", zIndex: 1 }}>
        <div>
          <span className="tp-kicker">Solicitud {b.code}</span>
          <h1 className="tp-display">
            ¡Listo, <span>{b.name.split(" ")[0]}!</span>
          </h1>
          <p className="tp-hero-copy">
            Recibimos tu solicitud. Te escribiremos por WhatsApp para confirmar el día y la hora.
          </p>
          <div className="tp-actions">

            <Link className="tp-btn tp-btn-secondary" href="/">
              Volver al inicio
            </Link>
          </div>
        </div>
        <div className="tp-panel">
          <dl className="tp-dl">
            <div>
              <dt>Servicios</dt>
              <dd>{b.serviceNames.join(", ")}</dd>
            </div>
            <div>
              <dt>Detalle de la cotización</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{b.notes ?? "Consulta los valores con el taller."}</dd>
            </div>
            <div>
              <dt>Vehículo</dt>
              <dd>
                {b.vehicleType === "scooter" ? "Scooter eléctrico" : "Bicicleta"} {b.vehicleDetails ?? ""}
              </dd>
            </div>
            <div>
              <dt>Fecha preferida</dt>
              <dd style={{ textTransform: "capitalize" }}>
                {formatDate(b.preferredDate)}, {slot}
              </dd>
            </div>
            <div>
              <dt>Retiro</dt>
              <dd>{b.pickup ? `${b.pickupCommune} · ${b.pickupAddress}` : "Lo llevo al taller"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
