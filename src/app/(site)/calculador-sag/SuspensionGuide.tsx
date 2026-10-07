"use client";

import { useRef, useState } from "react";
import { SagCalculator } from "./SagCalculator";
import styles from "./sag.module.css";

const steps = ["Prepara", "Mide el SAG", "Ajusta el rebote"];
const sensations = [
  { title: "Vuelve con un golpe", text: "Puede volver demasiado rápido. Prueba un clic hacia más lento y repite el tramo." },
  { title: "Se hunde entre baches seguidos", text: "Puede volver demasiado lento. Prueba un clic hacia más rápido y repite el tramo." },
  { title: "Acompaña el terreno", text: "Si vuelve sin golpe y recupera recorrido entre baches, conserva el ajuste y compruébalo en tu próxima salida." },
];

function Diagram({ rebound = false }: { rebound?: boolean }) {
  return <svg className={styles.diagram} viewBox="0 0 360 140" role="img" aria-label={rebound ? "El rebote controla la vuelta desde comprimida a extendida" : "El SAG es la distancia entre el retén y el anillo con la suspensión extendida"}>
    <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"><path d="M60 25v90h45V25M240 25v90h45V25" /><path d={rebound ? "M70 65h25M250 40h25" : "M70 40h25M250 65h25"} stroke="var(--tp-orange)" /></g>
    <path d="M140 65h65m-12-9 12 9-12 9" fill="none" stroke="var(--tp-orange)" strokeWidth="3" />
    <g fill="currentColor" fontSize="12" textAnchor="middle"><text x="83" y="136">{rebound ? "Comprimida" : "Sin carga"}</text><text x="263" y="136">{rebound ? "Vuelve a extenderse" : "Marca de hundimiento"}</text></g>
  </svg>;
}

export function SuspensionGuide() {
  const [step, setStep] = useState(0);
  const [sensation, setSensation] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);
  function go(next: number) { setStep(next); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }); }
  function download() {
    const values = Array.from(root.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[id], textarea[id]") ?? []).filter(input => input.value.trim()).map(input => `${root.current?.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() || input.id}: ${input.value}`);
    const blob = new Blob([`Mi configuración de suspensión · ${new Date().toLocaleDateString("es-CL")}\n\n${values.join("\n")}\n\nRebote: clics desde cerrado suavemente, siguiendo el manual. Horquilla y amortiguador se ajustan por separado.\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "mi-suspension.txt"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setSaved(true);
  }
  return <div ref={root} className={styles.journey}>
    <nav className={styles.progress} aria-label="Pasos de ajuste">{steps.map((label, index) => <button key={label} type="button" aria-current={step === index ? "step" : undefined} onClick={() => go(index)}><span>{index + 1}</span>{label}</button>)}</nav>
    <h2 ref={heading} tabIndex={-1} className={styles.journeyTitle}>{steps[step]}</h2>
    <div hidden={step !== 0}>
      <p className={styles.lead}>Mejor agarre y control empiezan con una suspensión ajustada para ti.</p>
      <div className={styles.quickCards}><article><b>Tu equipo habitual</b><p>Casco, zapatillas y mochila: mide con el peso que llevas al andar.</p></article><article><b>Regla y ayuda</b><p>Una persona que sostenga la bici facilita medir sin perder el equilibrio.</p></article><article><b>El manual de tu modelo</b><p>Busca el objetivo de SAG y el ajuste inicial de rebote. Anota cómo está ahora.</p></article></div>
      <details className={styles.details}><summary>¿Qué voy a ajustar?</summary><p><b>SAG:</b> cuánto se hunde con tu peso. Deja margen para acompañar el terreno. <b>Rebote:</b> qué tan rápido vuelve tras comprimirse. Primero SAG, después rebote.</p><p>Para cambiar presión usa una bomba de suspensión y respeta los límites del manual. En resorte, revisa muelle y precarga; esta guía no elige el muelle por ti.</p></details>
      <button type="button" className="tp-btn" onClick={() => go(1)}>Empezar con el SAG →</button>
    </div>
    <div hidden={step !== 1}>
      <p className={styles.lead}>Mide cuánto se hunde con tu peso y compáralo con el objetivo de tu modelo.</p>
      <details className={styles.details}><summary>¿Cómo lo mido?</summary><Diagram /><ol className={styles.steps}><li>Abre el bloqueo y prepara la compresión según el manual.</li><li>Sube con tu equipo y adopta la posición indicada por el fabricante. Deja que se asiente.</li><li>Con ayuda, lleva el anillo de goma hasta el retén mientras sigues sobre la bici.</li><li>Baja sin rebotar. Con la suspensión extendida, mide del retén al anillo y repite para confirmar.</li></ol></details>
      <SagCalculator />
      <details className={styles.details}><summary>¿Cómo corrijo el SAG?</summary><p>En suspensión de aire, más hundimiento del objetivo suele requerir más presión; menos hundimiento, menos presión. Haz cambios pequeños según el manual, ecualiza las cámaras cuando corresponda y vuelve a medir. En resorte, consulta los límites de precarga y la dureza del muelle.</p></details>
      <button type="button" className="tp-btn" onClick={() => go(2)}>Ya medí mi SAG · Seguir con rebote →</button>
    </div>
    <div hidden={step !== 2}>
      <p className={styles.lead}>Busca una vuelta controlada: que recupere recorrido sin darte un golpe.</p><Diagram rebound />
      <div className={styles.quickCards}><article><b>1. Ubica el control</b><p>Busca “rebound” en el manual. No todas las suspensiones permiten ajustarlo.</p></article><article><b>2. Parte de la referencia</b><p>Usa el ajuste recomendado para tu modelo y presión, después de medir el SAG.</p></article><article><b>3. Prueba un clic</b><p>Repite un tramo corto y fácil. Cambia un solo control cada vez.</p></article></div>
      <details className={styles.details}><summary>¿Dónde está y cómo cuento los clics?</summary><p>En muchas horquillas está abajo de una botella; en el amortiguador suele estar cerca de una perilla o palanca. Confirma cuál es en el manual: el color no basta.</p><p>Si el manual cuenta desde cerrado, gira suavemente hasta el tope, sin forzar, y cuenta los clics al abrir. Sigue las marcas “rápido/lento” de tu modelo. Si tiene dos rebotes, usa la referencia para ambos y ajusta uno por vez.</p><p>El rebote depende del SAG y de la presión o muelle. Si los cambias, vuelve a comprobarlo.</p></details>
      <h3>En el tramo de prueba, ¿qué sientes?</h3><div className={styles.sensations}>{sensations.map((item, index) => <button key={item.title} type="button" aria-pressed={sensation === index} onClick={() => setSensation(index)}>{item.title}</button>)}</div>
      <div aria-live="polite" className={styles.feedback}>{sensation !== null ? sensations[sensation].text : "Elige la sensación que más se parece a lo que notas."}<small>Es una pista para probar, no un diagnóstico. Comprueba también el SAG y cambia horquilla y amortiguador por separado.</small></div>
      <details className={styles.details}><summary>Guardar mi configuración</summary><p>Los datos de SAG se incluyen en la descarga. Anota los clics desde cerrado según tu manual; deja en blanco lo que no aplica.</p><div className={styles.inputGrid}>{[["fork-rebound", "Rebote de horquilla (clics abiertos)"], ["shock-rebound", "Rebote de amortiguador (clics abiertos)"]].map(([id, label]) => <label key={id} htmlFor={id} className={styles.field}>{label}<input id={id} type="number" min="0" step="1" placeholder="Ej.: 8" /></label>)}</div><label htmlFor="suspension-notes" className={styles.field}>Bici, modelo, presión y sensaciones<textarea id="suspension-notes" rows={3} placeholder="Anota la referencia usada y qué mejoró…" /></label><button type="button" className="tp-btn" onClick={download}>Descargar mis ajustes</button><p role="status">{saved ? "Ficha descargada. Guárdala para comparar en tu próxima salida." : "La ficha se descarga en tu dispositivo."}</p></details>
      <a href="https://tech.ridefox.com/bike/owners-manuals/2930/fork--2024-36mm-" target="_blank" rel="noopener noreferrer" className={styles.source}>Referencia: guía de SAG y rebote de FOX ↗</a>
    </div>
  </div>;
}
