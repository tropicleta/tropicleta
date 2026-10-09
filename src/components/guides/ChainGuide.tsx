"use client";

import { useState } from "react";
import styles from "./ChainGuide.module.css";

const situations = {
  stop: { title: "Voy a detenerme", action: "Deja una marcha liviana antes de parar", text: "Mientras bajas la velocidad y todavía puedes pedalear con control, cambia a un piñón más grande atrás. Así la siguiente partida exige menos fuerza. Si debes frenar de emergencia, prioriza detenerte.", steps: ["Reduce la velocidad", "Pedalea suave y aligera el cambio", "Detente", "Vuelve a partir progresivamente"] },
  hill: { title: "Se acerca una subida", action: "Anticipa el cambio", text: "Busca una marcha liviana antes de que los pedales se pongan muy duros. Sigue pedaleando, afloja la presión un instante y deja que el cambio entre antes de volver a empujar.", steps: ["Mira el terreno", "Elige una marcha más liviana", "Afloja la presión al cambiar", "Mantén un pedaleo que puedas sostener"] },
  start: { title: "Quedé parado en un cambio pesado", action: "Toma movimiento sin un pisotón", text: "En un lugar seguro, un impulso suave puede ayudarte a iniciar el movimiento. Después pedalea con poca presión para buscar una marcha liviana. Si estás en pendiente o sin control, bájate y prepara la marcha.", steps: ["Comprueba que puedas partir con control", "Inicia el movimiento suavemente", "Cambia con poca presión", "Acelera de a poco"] },
};

export function ChainGuide() {
  const [rings, setRings] = useState<"multi" | "single">("multi");
  const [situation, setSituation] = useState<keyof typeof situations>("stop");
  const advice = situations[situation];
  return <section className={styles.guide} aria-labelledby="chain-guide-title">
    <span className="tp-kicker">Aprende mirando</span><h2 id="chain-guide-title">Los cambios trabajan contigo</h2><p>El plato está delante, junto a los pedales. Los piñones están atrás, en la rueda. Elige cómo es tu bici para ver qué conviene cuidar.</p>
    <fieldset className={styles.choices}><legend>¿Cuántos platos tienes delante?</legend><label><input type="radio" name="chainrings" checked={rings === "multi"} onChange={() => setRings("multi")} />Dos o tres platos</label><label><input type="radio" name="chainrings" checked={rings === "single"} onChange={() => setRings("single")} />Un solo plato · monoplato</label></fieldset>
    {rings === "multi" ? <>
      <figure className={styles.chainPhoto}>
        <img src="/guias/cadena-cruzada-espanol.webp" alt="Comparación en español: evita plato pequeño con piñón pequeño y plato grande con piñón grande, en rojo. Una mejor alineación es plato pequeño con piñón grande o plato grande con piñón pequeño, en verde." width="1225" height="1284" loading="lazy" />
        <figcaption><strong>Rojo: evita los cruces extremos</strong><p>Pequeño con pequeño y grande con grande dejan la cadena muy diagonal.</p><strong className={styles.correct}>Verde: una mejor alineación</strong><p>Plato pequeño con piñones grandes; plato grande con piñones pequeños. También puedes usar piñones intermedios según el esfuerzo que necesites.</p></figcaption>
      </figure>
      <div className={styles.single}><strong>¿Qué combinación uso entonces?</strong><p>Con el plato pequeño, busca los piñones grandes o intermedios. Con el plato grande, busca los pequeños o intermedios. Elige una marcha cómoda y una línea de cadena menos diagonal.</p></div>
    </> : <div className={styles.single}><strong>Tu único plato está para usarse siempre</strong><p>En un sistema monoplato compatible, el rango se elige con los piñones de atrás. Usa una marcha que acompañe tu pendiente y ritmo; no necesitas cambiar de plato.</p><p className={styles.small}>Atrás: piñón más grande = pedaleo más liviano. Piñón más pequeño = pedaleo más pesado.</p></div>}
    <h3>¿Qué está pasando en tu salida?</h3><div className={styles.situations}>{Object.entries(situations).map(([id, item]) => <button key={id} type="button" aria-pressed={situation === id} onClick={() => setSituation(id as keyof typeof situations)}>{item.title}</button>)}</div>
    <div className={styles.advice} aria-live="polite"><h3>{advice.action}</h3><p>{advice.text}</p><ol>{advice.steps.map(step => <li key={step}>{step}</li>)}</ol></div>
    <p className={styles.small}>Un “tak tak” o un salto necesita revisión si se repite. La técnica ayuda a cuidar la transmisión, pero no corrige piezas gastadas ni un cambio desajustado.</p>
    <details className={styles.sources}><summary>Fuentes para seguir aprendiendo</summary><a href="https://www.trekbikes.com/sg/en_SG/owners-manual/riding-tips/" target="_blank" rel="noopener noreferrer">Trek: uso de cambios</a><a href="https://www.sram.com/sram/models/FC-FRC-1-D2" target="_blank" rel="noopener noreferrer">SRAM: transmisión monoplato</a><a href="https://www.parktool.com/en-us/blog/repair-help/when-to-replace-a-chain-on-a-bicycle" target="_blank" rel="noopener noreferrer">Park Tool: desgaste de cadena</a></details>
  </section>;
}
