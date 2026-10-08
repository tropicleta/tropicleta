"use client";
import { useState } from "react";
import Link from "next/link";
import { racePreparationChecks } from "@/data/race-preparation";
import styles from "./RaceChecklist.module.css";

type Status = "pending" | "checked" | "help";
export function RaceChecklist() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [date, setDate] = useState("");
  const checked = Object.values(statuses).filter(status => status === "checked").length;
  const help = racePreparationChecks.filter(item => statuses[item.id] === "help");
  const params = new URLSearchParams({ motivo: "carrera" });
  if (date) params.set("fechaCarrera", date);
  if (help.length) params.set("revisar", help.map(item => item.id).join(","));
  return <div className={styles.layout}>
    <section aria-labelledby="race-checklist-title"><h2 id="race-checklist-title">Anota qué has revisado</h2><p className={styles.intro}>Esto te ayuda a organizar la preparación; marcar una casilla no certifica el estado de la bici. Si encuentras una falla, consulta al taller antes de usarla.</p>
      <div className={styles.list}>{racePreparationChecks.map(item => <div className={styles.item} key={item.id} data-help={statuses[item.id] === "help"}>
        <label htmlFor={`race-${item.id}`}><strong>{item.title}</strong></label><p>{item.detail}</p>
        <select id={`race-${item.id}`} value={statuses[item.id] ?? "pending"} onChange={event => setStatuses(current => ({ ...current, [item.id]: event.target.value as Status }))}><option value="pending">Por revisar</option><option value="checked">Lo revisé</option><option value="help">Quiero consultar al taller</option></select>
        {statuses[item.id] === "help" && item.service && <Link href={`/servicios/?motivo=carrera&servicio=${item.service}`}>Ver un servicio relacionado →</Link>}
      </div>)}</div>
      <p className={styles.sources}>Referencias: <a href="https://www.trekbikes.com/us/en_US/pre-ride-checklist/" target="_blank" rel="noopener noreferrer">revisión previa de Trek</a> y <a href="https://www.sram.com/en/learn/road-axs-welcome-guide/tech-tips-and-tuning" target="_blank" rel="noopener noreferrer">guía técnica SRAM AXS</a>. Consulta el manual concreto de tu bicicleta y componentes.</p>
    </section>
    <aside className={styles.summary} aria-labelledby="race-request-title"><span className="tp-kicker">Tu próxima acción</span><h2 id="race-request-title">Coordina tu preparación</h2><label className={styles.date}>¿Cuándo es tu carrera? <span>Opcional</span><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
      <p role="status" aria-live="polite">{checked} de {racePreparationChecks.length} puntos marcados como revisados. {help.length} para consultar.</p>
      {help.length > 0 && <ul>{help.map(item => <li key={item.id}>{item.title}</li>)}</ul>}
      <p>La fecha de carrera y los puntos que quieres consultar se llevan a los comentarios de tu solicitud. Elige los servicios con sus inclusiones en el cotizador.</p>
      <Link className="tp-btn tp-btn-primary" href={`/servicios/?${params.toString()}`}>Preparar mi solicitud →</Link>
      <p className={styles.small}>Confirma con el taller la fecha de entrega y la disponibilidad de repuestos. Esta guía no es un pack ni una reserva confirmada.</p>
      <button type="button" onClick={() => { setStatuses({}); setDate(""); }}>Borrar mis marcas</button><p className={styles.small}>Las marcas se mantienen sólo mientras esta página está abierta.</p>
    </aside>
  </div>;
}
