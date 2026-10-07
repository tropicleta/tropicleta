"use client";

import { useState } from "react";
import { calculateSag, parseSagInput } from "@/lib/sag";
import styles from "./sag.module.css";

const fmt = (n: number) => n.toLocaleString("es-CL", { maximumFractionDigits: 1 });

function Suspension({ rear = false }: { rear?: boolean }) {
  const [length, setLength] = useState("");
  const [target, setTarget] = useState(rear ? "30" : "20");
  const [measured, setMeasured] = useState("");
  const result = calculateSag(parseSagInput(length), parseSagInput(target), measured.trim() === "" ? undefined : parseSagInput(measured));
  const id = rear ? "shock" : "fork";
  const fields = [
    { key: "length", label: rear ? "Carrera del amortiguador (mm)" : "Recorrido de horquilla (mm)", value: length, set: setLength, placeholder: rear ? "Ej.: 55" : "Ej.: 140" },
    { key: "target", label: "SAG objetivo (%)", value: target, set: setTarget, placeholder: "Ej.: 20" },
    { key: "measured", label: "Hundimiento medido (mm, opcional)", value: measured, set: setMeasured, placeholder: rear ? "Ej.: 16,5" : "Ej.: 28" },
  ];
  return <section className={styles.card} aria-labelledby={`${id}-title`}>
    <span className="tp-kicker">{rear ? "Suspensión trasera" : "Suspensión delantera"}</span>
    <h2 id={`${id}-title`} className="tp-display">{rear ? "Amortiguador" : "Horquilla"}</h2>
    <p id={`${id}-help`}>{rear ? "Usa la carrera indicada en la ficha técnica: en 210 × 55 mm, ingresa 55. No uses 210 ni el recorrido de la rueda trasera; el vástago visible tampoco siempre equivale a la carrera útil." : "Busca el recorrido útil en la ficha técnica de tu horquilla. La longitud visible de las barras puede ser diferente."}</p>
    {fields.map(field => <label className={styles.field} key={field.key} htmlFor={`${id}-${field.key}`}>
      {field.label}
      <input id={`${id}-${field.key}`} type="text" inputMode="decimal" value={field.value} placeholder={field.placeholder} aria-describedby={`${id}-help ${id}-result`} onChange={event => field.set(event.target.value)} />
    </label>)}
    <div id={`${id}-result`} className={styles.result} aria-live="polite" aria-atomic="true">
      {result.error ? <p>{length === "" ? "Ingresa las medidas de tu suspensión para calcular." : result.error}</p> : <>
        <span>SAG objetivo</span><strong>{fmt(result.targetMm!)} mm</strong>
        <p>{fmt(parseSagInput(length))} mm × {fmt(parseSagInput(target))} % ÷ 100</p>
        {result.measuredPercent !== undefined ? <>
          <span>SAG medido</span><strong>{fmt(result.measuredPercent)} %</strong>
          <p>{Math.abs(result.differenceMm!) < 0.05 ? "Tu medición coincide con el objetivo." : `${fmt(Math.abs(result.differenceMm!))} mm ${result.differenceMm! > 0 ? "por encima" : "por debajo"} del objetivo. ${result.differenceMm! > 0 ? "Hay más hundimiento del elegido." : "Hay menos hundimiento del elegido."}`}</p>
        </> : <p>Agrega tu medición para comparar con el objetivo.</p>}
      </>}
    </div>
  </section>;
}

export function SagCalculator() {
  const [bike, setBike] = useState("hardtail");
  return <div>
    <fieldset className={styles.types}>
      <legend>1. Elige tu bicicleta</legend>
      {[ ["hardtail", "Rígida / hardtail", "Con suspensión delantera"], ["full", "Doble suspensión", "Horquilla y amortiguador"], ["none", "Sin suspensión", "Horquilla y cuadro rígidos"] ].map(([value, label, detail]) => <label key={value} className={styles.choice}>
        <input type="radio" name="bike-sag" value={value} checked={bike === value} onChange={() => setBike(value)} /><span><b>{label}</b><small>{detail}</small></span>
      </label>)}
    </fieldset>
    {bike === "none" ? <div className={styles.card}><h2 className="tp-display">Aquí no hay SAG que ajustar</h2><p>El SAG de suspensión no aplica a una bicicleta sin horquilla ni amortiguador. La deformación de neumáticos es otra medida y no se calcula con esta herramienta.</p></div> : <>
      <p className={styles.note}>2. Ingresa tus medidas. Los objetivos iniciales de 20 % delante y 30 % detrás son ejemplos editables, no una recomendación universal. Usa primero el manual de tu bicicleta y suspensión.</p>
      <div className={styles.grid}><Suspension />{bike === "full" && <Suspension rear />}</div>
    </>}
  </div>;
}
