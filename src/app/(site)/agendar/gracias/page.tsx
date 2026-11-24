import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { bookingConfirmation } from "@/lib/booking-confirmation";
import { whatsappUrl } from "@/lib/whatsapp";
import styles from "./confirmation.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Solicitud recibida", robots: { index: false } };

type Props = { searchParams: Promise<{ codigo?: string | string[] }> };

export default async function GraciasAgendarPage({ searchParams }: Props) {
  const { codigo } = await searchParams;
  if (typeof codigo !== "string" || !codigo) notFound();
  const [booking] = await db.select().from(schema.bookings).where(eq(schema.bookings.code, codigo)).limit(1);
  if (!booking) notFound();

  const { groups, rows, total, pending, preferred, address, message } = bookingConfirmation(booking);

  return (
    <section className="tp-hero tp-page-hero">
      <div className={`tp-shell ${styles.shell}`}>
        <header>
          <span className="tp-kicker">Solicitud {booking.code}</span>
          <h1 className={`tp-display ${styles.title}`}>¡Tu cotización fue enviada correctamente!</h1>
          <p className="tp-hero-copy">Tu solicitud quedó registrada en nuestro taller. Te contactaremos para confirmar tu atención.</p>
        </header>

        <section className={`tp-panel ${styles.summary}`} aria-labelledby="quote-summary">
          <h2 id="quote-summary">Resumen de tu cotización</h2>
          {groups.map((group, index) => (
            <div key={index}>
              <h3>{group.label}</h3>
              {group.details && <p className="tp-hint">{group.details}</p>}
              <dl className={styles.rows}>
                {group.services.map(({ label, value }, serviceIndex) => (
                  <div key={serviceIndex}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            </div>
          ))}
          <dl className={styles.rows}>
            {rows.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
            <div className={styles.total}><dt>Total estimado</dt><dd>{total}</dd></div>
          </dl>
          {pending && <p className="tp-hint">{pending}</p>}
          <p className="tp-hint">Sujeto a diagnóstico y confirmación del taller.</p>
          <div className={styles.appointment}>
            <p><strong>Fecha preferida:</strong> {preferred}</p>
            {address && <p><strong>Dirección:</strong> {address}</p>}
          </div>
        </section>

        <div className={styles.contact}>
          <p>¿Quieres acelerar el proceso? Envíanos tu cotización directamente por WhatsApp.</p>
          <a className={`tp-btn ${styles.whatsapp}`} href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.91 11.91 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.94 11.94 0 0 0 5.79 1.48h.01c6.57 0 11.94-5.35 11.95-11.93a11.87 11.87 0 0 0-3.48-8.43ZM12.05 21.83a9.9 9.9 0 0 1-5.04-1.38l-.36-.22-3.71.98.99-3.62-.24-.38a9.86 9.86 0 0 1-1.51-5.28c0-5.47 4.45-9.91 9.92-9.91a9.85 9.85 0 0 1 7.01 2.91 9.85 9.85 0 0 1 2.9 7.01c0 5.47-4.45 9.9-9.96 9.9Zm5.44-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.77-1.65-2.06-.17-.3-.02-.46.13-.61l.45-.52c.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.71.63.72.23 1.37.2 1.89.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" /></svg>
            Enviar cotización por WhatsApp
          </a>
          <Link className="tp-btn tp-btn-secondary" href="/">Volver al inicio</Link>
        </div>
      </div>
    </section>
  );
}
