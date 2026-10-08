"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageZoom } from "@/components/shop/ImageZoom";
import { SagCalculator, SagSetup } from "./SagCalculator";
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
  const [ready, setReady] = useState<boolean[]>([false, false, false]);
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);
  function go(next: number) { setStep(next); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }); }
  function download() {
    const values = Array.from(root.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input[id], textarea[id], select[id]") ?? []).filter(input => input.value.trim() && input.type !== "checkbox" && !(bike === "hardtail" && input.id.startsWith("shock-"))).map(input => `${root.current?.querySelector(`label[for="${input.id}"]`)?.firstChild?.textContent?.trim() || input.id}: ${input.value}`);
    const blob = new Blob([`Mi configuración de suspensión · ${new Date().toLocaleDateString("es-CL")}\nBicicleta: ${bike === "hardtail" ? "Hardtail" : "Doble suspensión"}\n\n${values.join("\n")}\n\nConfirma el objetivo con el manual del modelo y la recomendación de tu bicicleta. Rebote: clics desde cerrado suavemente, siguiendo el manual. Horquilla y amortiguador se ajustan por separado.\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "mi-suspension.txt"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setSaved(true);
  }
  return <div ref={root} className={styles.journey}>
    <nav className={styles.progress} aria-label="Pasos de ajuste">{steps.map((label, index) => <button key={label} type="button" aria-current={step === index ? "step" : undefined} onClick={() => go(index)}><span>{index + 1}</span>{label}</button>)}</nav>
    <h2 ref={heading} tabIndex={-1} className={styles.journeyTitle}>{steps[step]}</h2>
    <div hidden={step !== 0}>
      <p className={styles.lead}>Cuando te subes, tu peso hunde un poco la suspensión. Ese hundimiento se llama SAG. Aquí aprenderás a medirlo; la calculadora hace las cuentas por ti.</p>
      <SagSetup bike={bike} setBike={setBike} />
      <section className={styles.preflight} aria-labelledby="sag-ready"><h3 id="sag-ready">Antes de medir: abre el bloqueo</h3><p>La suspensión debe poder moverse al subirte. Si tienes una palanca de bloqueo, ponla en <b>Open / abierto</b>, también si se maneja desde el manillar.</p><p>¿Tienes otras perillas? Anota cómo están y revisa en el manual cómo dejarlas para medir. No todas se preparan igual.</p>
        <details className={styles.details}><summary>Ejemplos oficiales: FOX y RockShox</summary><p><a href="https://tech.ridefox.com/bike/owners-manuals/2930/fork--2024-36mm-" target="_blank" rel="noopener noreferrer">FOX 36/38 (2024)</a>: compresión abierta para medir. <a href="https://docs.sram.com/en-US/publications/5ODr3E6BhL1uWDnWhq4ATB/UM%20-%20Suspension?models=fs-sid-xxwc-b2" target="_blank" rel="noopener noreferrer">RockShox: Solo Air / DebonAir / Dual Position Air</a>: la guía citada pide abrir compresión y rebote. <a href="https://www.sram.com/en/rockshox/rockshox-technology/vivid-air-setup" target="_blank" rel="noopener noreferrer">Vivid Air</a>: Threshold abierto y diales de compresión / rebote en la mitad. Confirma qué guía corresponde a tu versión.</p></details>
        {[
          "La suspensión está desbloqueada y lista para medir según su manual.",
          "Llevo mi equipo de siempre y alguien me ayuda a sostener la bici.",
          "Tengo una regla y el dato de recorrido o carrera de mi suspensión.",
        ].map((label, index) => <label key={label} className={styles.preflightCheck}><input type="checkbox" checked={ready[index]} onChange={event => setReady(values => values.map((value, position) => position === index ? event.target.checked : value))} /><span>{label}</span></label>)}
        <p role="status" className={styles.readyStatus}>{ready.filter(Boolean).length}/3 comprobaciones · {ready.every(Boolean) ? "Listo para medir." : "Revisa estos puntos antes de tomar la medición."}</p>
      </section>
      <details className={styles.details}><summary>Dos palabras que usaremos: SAG y rebote</summary><p><b>SAG = cuánto se hunde al subirte.</b> Lo medimos primero. <b>Rebote = qué tan rápido vuelve a estirarse después de un bache.</b> Lo revisamos después.</p><p>El aire o el muelle sostienen tu peso. Los controles de compresión y rebote regulan cómo se mueve la suspensión.</p></details>
      <button type="button" className={`tp-btn ${ready.every(Boolean) ? "tp-btn-primary" : "tp-btn-secondary"}`} onClick={() => go(1)}>Empezar con el SAG →</button>
    </div>
    <div hidden={step !== 1}>
      <p className={styles.lead}>Vas a medir una distancia pequeña con la regla. Esa medida nos dice cuánto se hundió la suspensión al subirte.</p>
      <div className={styles.measureLesson}><h3>Haz la medición en cuatro movimientos</h3><ol className={styles.lessonSteps}>
        <li><b>Sube listo para pedalear</b><span>Lleva casco, zapatillas, agua y mochila si la usas: el mismo peso que en tu salida o carrera. Con la bici sostenida, ponte como indica el manual y quédate quieto.</span></li>
        <li><b>Lleva el anillo hasta tocar el retén</b><span>Sin bajarte de la bici, pide que deslicen el anillo de goma hasta la goma por donde entra la barra: el retén. En la horquilla, bájalo por la barra como muestra la foto. No dejes un espacio entre ambos.</span></li>
        <li><b>Baja despacio</b><span>No saltes ni rebotes. Al quitar tu peso, la suspensión se estira y el anillo queda marcando cuánto se hundió.</span></li>
        <li><b>Mide el espacio</b><span>Con la regla, mide del retén al anillo, en milímetros. Escribe ese número en «Lo que medí». Repite para comprobarlo.</span></li>
      </ol><figure className={styles.measurePhoto}>
        <div><div className={styles.photoFrame}><Image src="/suspension/medicion-sag-horquilla.png" width={923} height={636} sizes="(max-width: 600px) 280px, 300px" alt="Horquilla con un anillo rojo en la barra y una regla entre el retén y el anillo para medir el SAG." /><ImageZoom src="/suspension/medicion-sag-horquilla.png" name="la foto del anillo medidor de SAG" /></div><p className={styles.zoomHint}>Toca la foto para acercar. Mueve el cursor o arrastra para ver los detalles; toca otra vez para salir.</p></div>
        <figcaption><b>Este es el anillo medidor de SAG</b><p>En la foto es rojo; el tuyo puede ser de otro color. Después de bajarte sin rebotar, mide la distancia entre el retén y el anillo con la suspensión estirada. Esa distancia es tu SAG en milímetros.</p><small>La foto sirve para ubicar el anillo y la regla. Desconecta la bomba antes de subirte a medir.</small></figcaption>
      </figure><details className={styles.details}><summary>Cómo colocar el anillo y casos especiales</summary>
        <figure className={styles.measurePhoto}><div><div className={styles.photoFrame}><Image src="/suspension/anillo-sag-horquilla.png" width={923} height={636} sizes="(max-width: 600px) 280px, 300px" alt="Anillo rojo separado del retén en una barra de horquilla. El retén está en la entrada de la barra a la parte inferior." /><ImageZoom src="/suspension/anillo-sag-horquilla.png" name="la foto de cómo colocar el anillo SAG" /></div><p className={styles.zoomHint}>Toca para acercar; mueve o arrastra para ver detalles.</p></div><figcaption><b>Antes de bajarte: anillo y retén juntos</b><p>En esta foto el anillo rojo está separado del retén. Para empezar la medición, mientras sigues sobre la bici, bájalo por la barra hasta que toque la goma de abajo, donde la barra entra en la horquilla.</p><p>Después baja de la bici sin rebotar. La barra se estira y queda un espacio entre el retén y el anillo: ese es el espacio que debes medir.</p></figcaption></figure>
        <p>En el amortiguador, lleva el anillo hasta su retén según el manual: la dirección puede cambiar según cómo esté instalado. Si no encuentras el anillo o no puedes acceder a él, consulta el método de tu modelo.</p><p>En algunos amortiguadores de muelle se mide la distancia entre sus dos anclajes, primero sin peso y después con el ciclista. La diferencia es el hundimiento. Para el porcentaje se usa la carrera del amortiguador, no el recorrido de la rueda.</p><p>Si cambiaste la presión de aire, sigue el procedimiento del manual para equilibrar sus cámaras antes de medir otra vez.</p></details></div>
      <div className={styles.setupSummary}><span>{bike === "hardtail" ? "Hardtail · horquilla" : "Doble suspensión · horquilla y amortiguador"}</span><button type="button" onClick={() => go(0)}>Cambiar tipo de bicicleta</button></div>
      <p className={styles.measureReminder}>¿Tienes la medida? Completa los campos de abajo. El bloqueo debe estar abierto y las demás perillas preparadas según el manual.</p>
      <SagCalculator bike={bike} />
      <details className={styles.details}><summary>¿Cómo corrijo el SAG?</summary><p><b>Usa el objetivo del manual de tu suspensión o la recomendación específica de tu bicicleta.</b> Si aún no encontraste esa referencia, puedes practicar el cálculo con el ejemplo y buscar el dato antes de ajustar.</p><p><b>Aire:</b> con un objetivo confirmado, más hundimiento suele requerir más presión; menos hundimiento, menos presión. Usa una bomba de suspensión, respeta límites y temperatura de referencia y realiza la ecualización indicada. Desconecta la bomba antes de medir; al reconectarla, la manguera se llena y puede bajar la lectura sin que exista una fuga.</p><p><b>Muelle:</b> la precarga cambia la carga inicial, no la dureza del muelle. No compenses un muelle inadecuado apretando sin límite; puede hacer falta otro muelle. El límite depende del modelo: no uses un número universal de vueltas.</p><p>Si el resultado cambia mucho entre intentos, revisa posición, fricción y estado de la suspensión antes de seguir ajustando.</p></details>
      <button type="button" className="tp-btn" onClick={() => go(2)}>Seguir con el rebote →</button>
    </div>
    <div hidden={step !== 2}>
      <p className={styles.lead}>El rebote es la velocidad con que la suspensión vuelve a estirarse. Queremos que vuelva a tiempo para el siguiente bache, sin darte un golpe.</p>
      <div className={styles.quickCards}><article><b>1. Ubica el control</b><p>Busca “rebound” en el manual. No todas las suspensiones permiten ajustarlo.</p></article><article><b>2. Parte de la referencia</b><p>Usa el ajuste recomendado para tu modelo y presión, después de medir el SAG.</p></article><article><b>3. Prueba un clic</b><p>Repite un tramo corto y fácil. Cambia un solo control cada vez.</p></article></div>
      <details className={styles.details}><summary>¿Dónde está el rebote y qué significa «un clic»?</summary><Diagram rebound /><p>Busca el control marcado como <b>Rebound / rebote</b> en el manual. En muchas horquillas está abajo de una de las patas. No te guíes solo por el color.</p><p><b>Un clic</b> es un pequeño paso que sientes al girar la perilla. Cambia solo un paso y vuelve a probar. Si el manual cuenta «desde cerrado», llega suavemente al tope indicado y cuenta los pasos al abrir; no fuerces la perilla.</p><p>Después de medir el SAG, deja el rebote en la posición inicial recomendada para tu presión o muelle. Si cambias presión o muelle, revisa también el rebote. Algunos modelos tienen dos controles: sigue el manual y cambia uno cada vez.</p><p>“Alta / baja velocidad” se refiere al movimiento de la suspensión, no a la velocidad de la bicicleta.</p></details>
      <h3>En el tramo de prueba, ¿qué sientes?</h3><div className={styles.sensations}>{sensations.map((item, index) => <button key={item.title} type="button" aria-pressed={sensation === index} onClick={() => setSensation(index)}>{item.title}</button>)}</div>
      <div aria-live="polite" className={styles.feedback}>{sensation !== null ? sensations[sensation].text : "Elige la sensación que más se parece a lo que notas."}<small>Es una pista para probar, no un diagnóstico. Comprueba también el SAG y cambia horquilla y amortiguador por separado.</small></div>
      <details className={styles.details}><summary>Guardar mi configuración</summary><p>Los datos de SAG se incluyen en la descarga. Anota los clics desde cerrado según tu manual; deja en blanco lo que no aplica.</p><div className={styles.inputGrid}>{[["fork-rebound", "Rebote de horquilla (clics abiertos)"], ["shock-rebound", "Rebote de amortiguador (clics abiertos)"]].filter(([id]) => bike === "full" || id === "fork-rebound").map(([id, label]) => <label key={id} htmlFor={id} className={styles.field}>{label}<input id={id} type="number" min="0" step="1" placeholder="Ej.: 8" /></label>)}</div><label htmlFor="suspension-notes" className={styles.field}>Bici, modelo, presión y sensaciones<textarea id="suspension-notes" rows={3} placeholder="Anota la referencia usada y qué mejoró…" /></label><button type="button" className="tp-btn tp-btn-primary" onClick={download}>Descargar mis ajustes</button><p role="status">{saved ? "Ficha descargada. Guárdala para comparar en tu próxima salida." : "La ficha se descarga en tu dispositivo."}</p></details>
      <a href="https://www.sram.com/en/rockshox/learn/suspension-fine-tuning" target="_blank" rel="noopener noreferrer" className={styles.source}>Referencia: guía de ajuste fino RockShox ↗</a>
    </div>
  </div>;
}
