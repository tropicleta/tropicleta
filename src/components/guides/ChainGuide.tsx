"use client";

import { useState } from "react";
import styles from "./ChainGuide.module.css";

function ChainLine({ crossed }: { crossed: boolean }) {
  const front = crossed ? 192 : 72;
  const color = crossed ? "#ff9393" : "#78d6be";
  return <svg viewBox="0 0 270 310" role="img" aria-label={crossed ? "Esquema: cadena diagonal entre plato grande y piñón grande" : "Esquema: cadena más alineada entre plato pequeño y piñón grande"}>
    <g fill="#25383e" stroke="#7e969d" strokeWidth="3"><ellipse cx="72" cy="83" rx="8" ry="38"/><ellipse cx="112" cy="83" rx="8" ry="29"/><ellipse cx="152" cy="83" rx="8" ry="22"/><ellipse cx="192" cy="83" rx="8" ry="15"/><ellipse cx="72" cy="235" rx="9" ry="31"/><ellipse cx="192" cy="235" rx="9" ry="49"/></g>
    <path d={`M72 46L${front} ${crossed ? 186 : 204}M72 121L${front} ${crossed ? 284 : 266}`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
    <g fill="#d8e3e5" fontFamily="Arial,sans-serif" fontSize="13"><text x="32" y="24">Piñones · atrás</text><text x="32" y="306">Platos · delante</text></g>
  </svg>;
}

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
    {rings === "multi" ? <><div className={styles.diagrams}><figure><ChainLine crossed={false} /><figcaption><strong>Busca una línea menos diagonal</strong><span>Ejemplo: plato pequeño delante y piñón grande atrás.</span></figcaption></figure><figure><ChainLine crossed /><figcaption><strong>Evita mantener cruces extremos</strong><span>Grande con grande, o pequeño con pequeño, deja la cadena más diagonal.</span></figcaption></figure></div><p className={styles.small}>Vista esquemática desde arriba. Alterna los platos según el terreno; no tienes que recorrer todos los cambios en cada salida.</p></> : <div className={styles.single}><strong>Tu único plato está para usarse siempre</strong><p>En un sistema monoplato compatible, el rango se elige con los piñones de atrás. Usa una marcha que acompañe tu pendiente y ritmo; no necesitas cambiar de plato.</p><p className={styles.small}>Atrás: piñón más grande = pedaleo más liviano. Piñón más pequeño = pedaleo más pesado.</p></div>}
    <h3>¿Qué está pasando en tu salida?</h3><div className={styles.situations}>{Object.entries(situations).map(([id, item]) => <button key={id} type="button" aria-pressed={situation === id} onClick={() => setSituation(id as keyof typeof situations)}>{item.title}</button>)}</div>
    <div className={styles.advice} aria-live="polite"><h3>{advice.action}</h3><p>{advice.text}</p><ol>{advice.steps.map(step => <li key={step}>{step}</li>)}</ol></div>
    <p className={styles.small}>Un “tak tak” o un salto necesita revisión si se repite. La técnica ayuda a cuidar la transmisión, pero no corrige piezas gastadas ni un cambio desajustado.</p>
    <details className={styles.sources}><summary>Fuentes para seguir aprendiendo</summary><a href="https://www.trekbikes.com/sg/en_SG/owners-manual/riding-tips/" target="_blank" rel="noopener noreferrer">Trek: uso de cambios</a><a href="https://www.sram.com/sram/models/FC-FRC-1-D2" target="_blank" rel="noopener noreferrer">SRAM: transmisión monoplato</a><a href="https://www.parktool.com/en-us/blog/repair-help/when-to-replace-a-chain-on-a-bicycle" target="_blank" rel="noopener noreferrer">Park Tool: desgaste de cadena</a></details>
  </section>;
}
