"use client";

import { useRef, useState } from "react";
import { SagCalculator, SagSetup } from "./SagCalculator";
import { cyclingDisciplines } from "@/data/cycling-disciplines";
import styles from "./sag.module.css";

const steps = ["Prepara", "Mide el SAG", "Ajusta el rebote"];
const sensations = [
  { title: "Vuelve con un golpe", text: "Si la extensión es demasiado rápida, prueba un clic hacia más lento según el manual y repite el tramo. Un ruido o golpe mecánico persistente requiere revisión, no seguir cerrando el rebote." },
  { title: "No recupera entre baches", text: "Si no alcanza a extenderse entre impactos, puede haber demasiado frenado de rebote. Prueba un clic hacia más rápido según el manual. Si sigue hundiéndose, revisa también presión o muelle y compresión." },
  { title: "Acompaña el terreno", text: "Si vuelve sin golpe y recupera recorrido entre baches, conserva el ajuste y compruébalo en tu próxima salida." },
];

function Diagram({ rebound = false }: { rebound?: boolean }) {
  return <svg className={styles.diagram} viewBox="0 0 360 140" role="img" aria-label={rebound ? "El rebote controla la vuelta desde comprimida a extendida" : "El SAG es la distancia entre el retén y el anillo con la suspensión extendida"}>
    <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"><path d={rebound ? "M65 55h35M70 55v40M95 55v40" : "M65 20h35M70 20v75M95 20v75"} /><path d="M70 92v22h25V92M250 92v22h25V92" stroke="#7d8a91" /><path d="M245 20h35M250 20v75M275 20v75" /></g>
    {!rebound && <g stroke="var(--tp-orange)" strokeWidth="3"><path d="M65 90h35M245 60h35M303 60v30M298 60h10M298 90h10" /><text x="312" y="79" fill="var(--tp-orange)" stroke="none" fontSize="12">SAG</text></g>}
    <path d="M140 65h65m-12-9 12 9-12 9" fill="none" stroke="var(--tp-orange)" strokeWidth="3" />
    <g fill="currentColor" fontSize="11" textAnchor="middle"><text x="83" y="136">{rebound ? "Comprimida" : "Anillo contra el retén"}</text><text x="263" y="136">{rebound ? "Extendida" : "Tras bajar sin rebotar"}</text></g>
  </svg>;
}

export function SuspensionGuide() {
  const [step, setStep] = useState(0);
  const [sensation, setSensation] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [bike, setBike] = useState("hardtail");
  const [discipline, setDiscipline] = useState("unknown");
  const [ready, setReady] = useState<boolean[]>([false, false, false]);
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);
  function go(next: number) { setStep(next); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }); }
  function download() {
    const values = Array.from(root.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input[id], textarea[id], select[id]") ?? []).filter(input => input.value.trim() && input.type !== "checkbox" && !(bike === "hardtail" && input.id.startsWith("shock-"))).map(input => `${root.current?.querySelector(`label[for="${input.id}"]`)?.firstChild?.textContent?.trim() || input.id}: ${input.value}`);
    const blob = new Blob([`Mi configuración de suspensión · ${new Date().toLocaleDateString("es-CL")}\nBicicleta: ${bike === "hardtail" ? "Hardtail" : "Doble suspensión"}\nDisciplina: ${cyclingDisciplines.find(item => item.id === discipline)?.label}\n\n${values.join("\n")}\n\nObjetivos orientativos; confirma con el manual del modelo. Rebote: clics desde cerrado suavemente, siguiendo el manual. Horquilla y amortiguador se ajustan por separado.\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "mi-suspension.txt"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setSaved(true);
  }
  return <div ref={root} className={styles.journey}>
    <nav className={styles.progress} aria-label="Pasos de ajuste">{steps.map((label, index) => <button key={label} type="button" aria-current={step === index ? "step" : undefined} onClick={() => go(index)}><span>{index + 1}</span>{label}</button>)}</nav>
    <h2 ref={heading} tabIndex={-1} className={styles.journeyTitle}>{steps[step]}</h2>
    <div hidden={step !== 0}>
      <p className={styles.lead}>Elige tu bici y disciplina. Prepararemos un objetivo editable para el siguiente paso.</p>
      <SagSetup bike={bike} discipline={discipline} setBike={setBike} setDiscipline={setDiscipline} />
      <section className={styles.preflight} aria-labelledby="sag-ready"><h3 id="sag-ready">Antes de medir: abre el bloqueo</h3><p>Pon la palanca de bloqueo / plataforma en Open, incluido el mando remoto. Anota los clics actuales antes de mover los diales.</p><p><b>Compresión y rebote: sigue el procedimiento del modelo.</b> No hay una posición universal para medir: algunos manuales piden diales abiertos; otros, posición media. “Open” en una palanca no siempre abre todos los ajustes independientes.</p>
        <details className={styles.details}><summary>Ejemplos oficiales: FOX y RockShox</summary><p><a href="https://tech.ridefox.com/bike/owners-manuals/2930/fork--2024-36mm-" target="_blank" rel="noopener noreferrer">FOX 36/38 (2024)</a>: compresión abierta para medir. <a href="https://docs.sram.com/en-US/publications/5ODr3E6BhL1uWDnWhq4ATB/UM%20-%20Suspension?models=fs-sid-xxwc-b2" target="_blank" rel="noopener noreferrer">RockShox: Solo Air / DebonAir / Dual Position Air</a>: la guía citada pide abrir compresión y rebote. <a href="https://www.sram.com/en/rockshox/rockshox-technology/vivid-air-setup" target="_blank" rel="noopener noreferrer">Vivid Air</a>: Threshold abierto y diales de compresión / rebote en la mitad. Confirma qué guía corresponde a tu versión.</p></details>
        {[
          "Abrí el bloqueo y preparé los diales para medir según el manual.",
          "Llevo mi equipo habitual y tengo la bici estable, con apoyo o ayuda.",
          "Tengo una regla y sé dónde medir el recorrido de horquilla o la carrera del amortiguador.",
        ].map((label, index) => <label key={label} className={styles.preflightCheck}><input type="checkbox" checked={ready[index]} onChange={event => setReady(values => values.map((value, position) => position === index ? event.target.checked : value))} /><span>{label}</span></label>)}
        <p role="status" className={styles.readyStatus}>{ready.filter(Boolean).length}/3 comprobaciones · {ready.every(Boolean) ? "Listo para medir." : "Revisa estos puntos antes de tomar la medición."}</p>
      </section>
      <details className={styles.details}><summary>¿Qué voy a ajustar?</summary><p><b>SAG:</b> cuánto se hunde con tu peso. Deja margen para acompañar el terreno. <b>Rebote:</b> qué tan rápido vuelve tras comprimirse. Primero SAG, después rebote.</p><p>Para cambiar presión usa una bomba de suspensión y respeta los límites del manual. En resorte, revisa muelle y precarga; esta guía no elige el muelle por ti.</p></details>
      <button type="button" className="tp-btn" onClick={() => go(1)}>Empezar con el SAG →</button>
    </div>
    <div hidden={step !== 1}>
      <p className={styles.lead}>Mide cuánto se hunde con tu peso y compáralo con el objetivo de tu modelo.</p>
      <details className={styles.details}><summary>¿Cómo lo mido?</summary><Diagram /><ol className={styles.steps}><li>Prepara bloqueo y diales según el manual. Si cambiaste presión, ecualiza las cámaras con el procedimiento de ese modelo.</li><li>Sube con tu equipo y adopta la posición indicada por el fabricante. Deja que se asiente, sin balancearte ni mantener los frenos accionados innecesariamente.</li><li>Con ayuda, lleva el anillo de goma hasta el retén mientras sigues sobre la bici.</li><li>Baja sin rebotar. Con la suspensión extendida, mide del retén al anillo. Repite en la misma posición para comprobar consistencia.</li></ol><p>En amortiguadores de muelle con vástago inaccesible, el manual puede indicar medir la diferencia entre ejes con y sin carga. Esa diferencia se divide por la carrera del amortiguador, nunca por el recorrido de la rueda.</p></details>
      <div className={styles.setupSummary}><span>{bike === "hardtail" ? "Hardtail · horquilla" : "Doble suspensión · horquilla y amortiguador"} · {cyclingDisciplines.find(item => item.id === discipline)?.label}</span><button type="button" onClick={() => go(0)}>Cambiar bicicleta o disciplina</button></div>
      <p className={styles.measureReminder}>Mide con el bloqueo abierto y la compresión preparada según el manual. Puedes editar cada objetivo; el valor personalizado se conserva si cambias de paso o disciplina.</p>
      <SagCalculator bike={bike} discipline={discipline} />
      <details className={styles.details}><summary>¿Cómo corrijo el SAG?</summary><p><b>Primero valida el objetivo en el manual de la bicicleta y del componente.</b> El escenario por disciplina sirve para explorar el cálculo; no justifica por sí solo cambiar presión o precarga.</p><p><b>Aire:</b> con un objetivo confirmado, más hundimiento suele requerir más presión; menos hundimiento, menos presión. Usa una bomba de suspensión, respeta límites y temperatura de referencia y realiza la ecualización indicada. Desconecta la bomba antes de medir; al reconectarla, la manguera se llena y puede bajar la lectura sin que exista una fuga.</p><p><b>Muelle:</b> la precarga cambia la carga inicial, no la dureza del muelle. No compenses un muelle inadecuado apretando sin límite; puede hacer falta otro muelle. El límite depende del modelo: no uses un número universal de vueltas.</p><p>Si el resultado cambia mucho entre intentos, revisa posición, fricción y estado de la suspensión antes de seguir ajustando.</p></details>
      <button type="button" className="tp-btn" onClick={() => go(2)}>Ya medí mi SAG · Seguir con rebote →</button>
    </div>
    <div hidden={step !== 2}>
      <p className={styles.lead}>Después del SAG, restablece el rebote recomendado para tu presión o muelle. Busca una vuelta controlada.</p><Diagram rebound />
      <div className={styles.quickCards}><article><b>1. Ubica el control</b><p>Busca “rebound” en el manual. No todas las suspensiones permiten ajustarlo.</p></article><article><b>2. Parte de la referencia</b><p>Usa el ajuste recomendado para tu modelo y presión, después de medir el SAG.</p></article><article><b>3. Prueba un clic</b><p>Repite un tramo corto y fácil. Cambia un solo control cada vez.</p></article></div>
      <details className={styles.details}><summary>¿Dónde está y cómo cuento los clics?</summary><p>En muchas horquillas está abajo de una botella; en el amortiguador suele estar cerca de una perilla o palanca. Confirma cuál es en el manual: el color no basta.</p><p>Si el manual cuenta desde cerrado, gira suavemente hasta el tope, sin forzar, y cuenta los clics al abrir. Sigue las marcas “rápido/lento” de tu modelo. Si tiene dos rebotes, usa la referencia para ambos y ajusta uno por vez.</p><p>La referencia de rebote depende de la presión de aire o de la dureza del muelle. Si los cambias, vuelve a comprobarla. “Alta / baja velocidad” se refiere al movimiento de la suspensión, no a la velocidad de la bicicleta.</p></details>
      <h3>En el tramo de prueba, ¿qué sientes?</h3><div className={styles.sensations}>{sensations.map((item, index) => <button key={item.title} type="button" aria-pressed={sensation === index} onClick={() => setSensation(index)}>{item.title}</button>)}</div>
      <div aria-live="polite" className={styles.feedback}>{sensation !== null ? sensations[sensation].text : "Elige la sensación que más se parece a lo que notas."}<small>Es una pista para probar, no un diagnóstico. Comprueba también el SAG y cambia horquilla y amortiguador por separado.</small></div>
      <details className={styles.details}><summary>Guardar mi configuración</summary><p>Los datos de SAG se incluyen en la descarga. Anota los clics desde cerrado según tu manual; deja en blanco lo que no aplica.</p><div className={styles.inputGrid}>{[["fork-rebound", "Rebote de horquilla (clics abiertos)"], ["shock-rebound", "Rebote de amortiguador (clics abiertos)"]].map(([id, label]) => <label key={id} htmlFor={id} className={styles.field}>{label}<input id={id} type="number" min="0" step="1" placeholder="Ej.: 8" /></label>)}</div><label htmlFor="suspension-notes" className={styles.field}>Bici, modelo, presión y sensaciones<textarea id="suspension-notes" rows={3} placeholder="Anota la referencia usada y qué mejoró…" /></label><button type="button" className="tp-btn" onClick={download}>Descargar mis ajustes</button><p role="status">{saved ? "Ficha descargada. Guárdala para comparar en tu próxima salida." : "La ficha se descarga en tu dispositivo."}</p></details>
      <a href="https://www.sram.com/en/rockshox/learn/suspension-fine-tuning" target="_blank" rel="noopener noreferrer" className={styles.source}>Referencia: guía de ajuste fino RockShox ↗</a>
    </div>
  </div>;
}
