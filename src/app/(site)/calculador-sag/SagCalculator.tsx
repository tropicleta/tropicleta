"use client";

import { useState } from "react";
import { calculateSag, parseSagInput } from "@/lib/sag";
import styles from "./sag.module.css";
import { cyclingDisciplines } from "@/data/cycling-disciplines";

const fmt = (n: number) => n.toLocaleString("es-CL", { maximumFractionDigits: 1 });

function Suspension({ rear = false }: { rear?: boolean }) {
  const [length, setLength] = useState("");
  const [target, setTarget] = useState(rear ? "30" : "20");
  const [measured, setMeasured] = useState("");
  const [brand, setBrand] = useState("unknown");
  const [model, setModel] = useState("unknown");
  const knownModel = brand === "FOX" && model !== "unknown";
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
    <details className={styles.details}><summary>Ayuda para encontrar mi modelo y objetivo</summary>
    <div className={styles.inputGrid}>
      <label className={styles.field} htmlFor={`${id}-brand`}>Marca de {rear ? "amortiguador" : "horquilla"}
        <select id={`${id}-brand`} value={brand} onChange={event => { setBrand(event.target.value); setModel("unknown"); }}>
          <option value="unknown">No sé qué marca tengo</option>
          {["FOX", "RockShox", "SR Suntour", "Öhlins", "Otra"].map(name => <option key={name}>{name}</option>)}
        </select>
      </label>
      {brand === "FOX" && <label className={styles.field} htmlFor={`${id}-model`}>Modelo y año de referencia
        <select id={`${id}-model`} value={model} onChange={event => { setModel(event.target.value); if (event.target.value !== "unknown") setTarget(rear ? "30" : "20"); }}>
          <option value="unknown">Otro modelo / no lo sé</option>
          {(rear ? ["FLOAT DPS · 2018", "FLOAT DPX2 · 2018"] : ["36 · 2024", "38 · 2024"]).map(name => <option key={name}>{name}</option>)}
        </select>
      </label>}
    </div>
    <div className={styles.modelHelp}>
      {knownModel ? <><b>Referencia para FOX {model}</b><p>Rango del manual: {rear ? "25–30" : "15–20"} %. Elige un punto de partida:</p><div className={styles.presets}>{[rear ? 25 : 15, rear ? 30 : 20].map(percent => <button type="button" key={percent} aria-pressed={target === String(percent)} onClick={() => setTarget(String(percent))}>{percent} %</button>)}</div><p>Confirma también la recomendación del fabricante de tu bicicleta. El recorrido o carrera varía según la versión: ingrésalo abajo.</p></> : <><b>{brand === "unknown" ? "¿No sabes cuál tienes?" : `Tu suspensión: ${brand}`}</b><p>{brand === "unknown" ? "Busca la marca y el modelo en las etiquetas de la suspensión. La marca de la bicicleta puede ser distinta." : "La marca por sí sola no define el ajuste. Busca el modelo, año y objetivo de SAG en su manual."} Puedes calcular con el ejemplo inicial, pero no es una recomendación para tu modelo.</p></>}
    </div>
    </details>
    <p id={`${id}-help`}>{rear ? "Usa la carrera indicada en la ficha técnica: en 210 × 55 mm, ingresa 55. No uses 210 ni el recorrido de la rueda trasera; el vástago visible tampoco siempre equivale a la carrera útil." : "Busca el recorrido útil en la ficha técnica de tu horquilla. La longitud visible de las barras puede ser diferente."}</p>
    <div className={styles.inputGrid}>{fields.map(field => <label className={styles.field} key={field.key} htmlFor={`${id}-${field.key}`}>
      {field.label}
      <input id={`${id}-${field.key}`} type="text" inputMode="decimal" value={field.value} placeholder={field.placeholder} aria-describedby={`${id}-help ${id}-result`} onChange={event => field.set(event.target.value)} />
    </label>)}</div>
    <div id={`${id}-result`} className={styles.result} aria-live="polite" aria-atomic="true">
      {result.error ? <p>{length === "" ? "Ingresa las medidas de tu suspensión para calcular." : result.error}</p> : <>
        <div className={styles.resultMetrics}><div><span>Tu objetivo</span><strong>{fmt(result.targetMm!)} <small>mm</small></strong><span>{fmt(parseSagInput(target))} % de {fmt(parseSagInput(length))} mm</span></div>
        <div><span>Tu medición</span><strong>{result.measuredPercent === undefined ? "—" : fmt(result.measuredPercent)} <small>%</small></strong><span>{measured.trim() === "" ? "Medición opcional" : `${measured} mm de hundimiento`}</span></div></div>
        {result.measuredPercent !== undefined ? <>
          <p>{Math.abs(result.differenceMm!) < 0.05 ? "Tu medición coincide con el objetivo." : `${fmt(Math.abs(result.differenceMm!))} mm ${result.differenceMm! > 0 ? "por encima" : "por debajo"} del objetivo. ${result.differenceMm! > 0 ? "Hay más hundimiento del elegido." : "Hay menos hundimiento del elegido."}`}</p>
        </> : <p>Agrega tu medición para comparar con el objetivo.</p>}
      </>}
    </div>
  </section>;
}

export function SagCalculator() {
  const [bike, setBike] = useState("hardtail");
  const [discipline, setDiscipline] = useState("unknown");
  const selectedDiscipline = cyclingDisciplines.find(item => item.id === discipline)!;
  return <div>
    <fieldset className={styles.types}>
      <legend>Elige tu bicicleta</legend>
      {[ ["hardtail", "Hardtail", "Solo suspensión delantera"], ["full", "Doble suspensión", "Horquilla y amortiguador"] ].map(([value, label, detail]) => <label key={value} className={styles.choice}>
        <input type="radio" name="bike-sag" value={value} checked={bike === value} onChange={() => setBike(value)} /><span><b>{label}</b><small>{detail}</small></span>
      </label>)}
    </fieldset>
    <details className={styles.details}><summary>Orientarme por mi disciplina (opcional)</summary><div className={styles.disciplineRow}>
      <label className={styles.field} htmlFor="sag-discipline">¿Qué disciplina practicas?
        <select id="sag-discipline" value={discipline} onChange={event => setDiscipline(event.target.value)}>{cyclingDisciplines.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select>
      </label>
      <div className={styles.disciplineInfo} aria-live="polite">{selectedDiscipline.sag ? <><b>{selectedDiscipline.label}: {selectedDiscipline.sag}</b><p>Referencia general de <a href="https://www.simplon.com/en/About-us/Magazine/How-to-adjust-your-MTB-s-suspension_bba_10490" target="_blank" rel="noopener noreferrer">SIMPLON</a>. Orienta por uso, pero no se aplica automáticamente a la horquilla ni al amortiguador: el manual de tu modelo tiene prioridad.</p></> : <><b>Elige el objetivo de tu suspensión</b><p>La disciplina da contexto. Sin una referencia específica para tu modelo, el porcentaje inicial es solo un ejemplo; puedes medir y comparar sin conocer la marca.</p></>}</div>
    </div>
    </details><>
      <h2 className={styles.stepTitle}>Calcula y compara</h2>
      <p className={styles.note}>Ingresa el recorrido y el porcentaje indicado en tu manual. Agrega el hundimiento medido para compararlo.</p>
      <div className={styles.grid}><Suspension />{bike === "full" && <Suspension rear />}</div>
      <p className={styles.note}>20 % delante y 30 % detrás son ejemplos editables. El objetivo correcto depende de tu bicicleta y suspensión.</p>
    </>
  </div>;
}

