"use client";

import { useState } from "react";
import Image from "next/image";
import { calculateSag, parseSagInput, suggestSag } from "@/lib/sag";
import styles from "./sag.module.css";
import { findSagReference, sagReferences } from "@/data/sag-references";

const fmt = (n: number) => n.toLocaleString("es-CL", { maximumFractionDigits: 1 });

function Suspension({ rear = false }: { rear?: boolean }) {
  const [length, setLength] = useState("");
  const [manualTarget, setTarget] = useState<string | null>(null);
  const [measured, setMeasured] = useState("");
  const [brand, setBrand] = useState("unknown");
  const [model, setModel] = useState("unknown");
  const [spring, setSpring] = useState("unknown");
  const reference = findSagReference(brand, model, rear, spring);
  const models = sagReferences.filter(item => item.brand === brand && item.rear === rear && (spring === "unknown" || item.spring === spring));
  const suggestion = suggestSag("unknown", rear, reference);
  const target = manualTarget ?? String(suggestion.value);
  const measuredHelp = rear && (spring === "coil" || reference?.spring === "coil") ? "Diferencia entre anclajes con y sin tu peso, según el manual. Opcional." : "Del retén al anillo, después de bajarte. Opcional: sin este dato verás solo el objetivo.";
  const result = calculateSag(parseSagInput(length), parseSagInput(target), measured.trim() === "" ? undefined : parseSagInput(measured));
  const id = rear ? "shock" : "fork";
  const fields = [
    { key: "length", label: rear ? "1. Carrera (mm)" : "1. Recorrido total (mm)", value: length, set: setLength, placeholder: rear ? "Ej.: 55" : "Ej.: 140" },
    { key: "target", label: "2. SAG objetivo (%)", value: target, set: setTarget, placeholder: "Ej.: 20" },
    { key: "measured", label: "3. Lo que medí con la regla (mm)", value: measured, set: setMeasured, placeholder: rear ? "Ej.: 16,5" : "Ej.: 28" },
  ];
  return <section className={styles.card} aria-labelledby={`${id}-title`}>
    <span className="tp-kicker">{rear ? "Suspensión trasera" : "Suspensión delantera"}</span>
    <h2 id={`${id}-title`} className="tp-display">{rear ? "Amortiguador" : "Horquilla"}</h2>
    <label className={styles.field} htmlFor={`${id}-spring`}>Tipo de resorte
      <select id={`${id}-spring`} value={spring} onChange={event => { setSpring(event.target.value); setModel("unknown"); setTarget(null); }}><option value="unknown">No lo sé todavía</option><option value="air">Aire</option><option value="coil">Muelle / resorte helicoidal</option></select>
    </label>
    <details className={styles.details} open><summary>Ayuda para encontrar mi modelo y objetivo</summary>
    <div className={styles.inputGrid}>
      <label className={styles.field} htmlFor={`${id}-brand`}>Marca de {rear ? "amortiguador" : "horquilla"}
        <select id={`${id}-brand`} value={brand} onChange={event => { setBrand(event.target.value); setModel("unknown"); setTarget(null); }}>
          <option value="unknown">No sé qué marca tengo</option>
          {[...new Set(sagReferences.map(item => item.brand)), "Otra"].map(name => <option key={name}>{name}</option>)}
        </select>
      </label>
      {models.length > 0 && <label className={styles.field} htmlFor={`${id}-model`}>Modelo, versión o guía de referencia
        <select id={`${id}-model`} value={model} onChange={event => { setModel(event.target.value); setTarget(null); }}>
          <option value="unknown">Otro modelo / no lo sé</option>
          {models.map(item => <option key={item.label}>{item.label}</option>)}
        </select>
      </label>}
    </div>
    <div className={styles.modelHelp}>
      {reference ? <><b>Referencia para {brand} {model}</b><p>{reference.range ? `Referencia oficial: ${suggestion.range}. ${reference.range[0] === reference.range[1] ? "Es un punto de partida." : "Puedes elegir dentro del rango:"}` : "Este manual usa otro método de ajuste."}</p>{reference.range && <div className={styles.presets}>{[...new Set(reference.range)].map(percent => <button type="button" key={percent} aria-pressed={target === String(percent)} onClick={() => setTarget(String(percent))}>{percent} %</button>)}</div>}<p>{reference.note}</p><a className={styles.source} href={reference.url} target="_blank" rel="noopener noreferrer">Ver referencia oficial ↗</a>{reference.range === null && <p><a className={styles.source} href="https://trailhead.rockshox.com/" target="_blank" rel="noopener noreferrer">Buscar mi suspensión en TrailHead ↗</a></p>}<p>Comprueba modelo, versión y recomendación del cuadro. Ingresa el recorrido o carrera de tu unidad abajo.</p></> : <><b>{brand === "unknown" ? "¿No sabes cuál tienes?" : `Tu suspensión: ${brand}`}</b><p>{brand === "unknown" ? "Busca marca y modelo en la suspensión; pueden ser distintos a los de la bici." : "Busca el modelo y año en su manual para conocer el objetivo."}</p></>}
    </div>
    {reference?.range === null && <figure className={styles.serialHelp}>
      <Image src="/suspension/rockshox-numero-serie.svg" width={129} height={301} alt="Ilustración oficial de TrailHead con la ubicación del número de serie resaltada en la corona de una horquilla RockShox." />
      <figcaption><b>¿Dónde está el número de serie?</b><p>Busca detrás de la corona: la pieza que une las dos barras, justo debajo del cuadro. Suele estar grabado allí. Copia todas sus letras y números en TrailHead.</p><p>La ubicación puede variar según el modelo. <a className={styles.source} href="https://support.rockshox.com/hc/en-us/articles/19288477684891-Where-is-the-serial-number-located-on-my-SRAM-product" target="_blank" rel="noopener noreferrer">Ver guía oficial de ubicaciones ↗</a></p><small>Ilustración: RockShox TrailHead.</small></figcaption>
    </figure>}
    </details>
    <div className={styles.targetHint} id={`${id}-suggestion`}>
      <b>{manualTarget !== null ? "Objetivo personalizado" : suggestion.verified ? "Punto de partida del manual" : reference ? "Ejemplo para comparar, no objetivo del manual" : "Ejemplo inicial editable"}: {Number.isFinite(parseSagInput(target)) ? `${fmt(parseSagInput(target))} %` : "ingresa un porcentaje válido"}</b>
      <p>{suggestion.range ? `Referencia: ${suggestion.range}. ${reference?.range?.[0] === reference?.range?.[1] && reference ? "Usamos ese valor para empezar." : `Usamos el punto medio (${fmt(suggestion.value)} %) para empezar.`}` : reference ? "Para configurar esta horquilla, sigue la presión de TrailHead y el procedimiento oficial." : "Para ajustar, reemplázalo por el objetivo de tu manual."} {suggestion.verified ? "Comprueba modelo y versión." : reference ? "Sigue el método de tu suspensión." : ""}</p>
      {reference && <details className={styles.details}><summary>¿De dónde sale este porcentaje?</summary><p>{suggestion.source}.</p></details>}
      {manualTarget !== null && <button type="button" onClick={() => setTarget(null)}>Usar sugerencia de {fmt(suggestion.value)} %</button>}
    </div>
    <div className={styles.measureFields}>{fields.map(field => <label className={styles.field} key={field.key} htmlFor={`${id}-${field.key}`}>
      <span className={styles.fieldLabel}>{field.label}</span>
      <input id={`${id}-${field.key}`} type="text" inputMode="decimal" value={field.value} placeholder={field.placeholder} aria-describedby={`${id}-${field.key}-help`} onChange={event => field.set(event.target.value)} />
      <small id={`${id}-${field.key}-help`} className={styles.fieldHelp}>{field.key === "length" ? rear ? "De la ficha técnica: 210 × 55 mm → escribe 55. No uses el recorrido de la rueda." : "Recorrido de la ficha técnica, no el largo del tubo visible." : field.key === "target" ? "Porcentaje que se hunde con tu peso. Editable: 20 % de 100 mm = 20 mm." : measuredHelp}</small>
    </label>)}</div>
    <div id={`${id}-result`} className={styles.result} aria-live="polite" aria-atomic="true">
      {result.error ? <p>{length === "" ? "Completa el dato 1 para ver el resultado." : result.error}</p> : <>
        <p className={styles.resultIntro}>Compara estas dos distancias, ambas en milímetros.</p>
        <div className={styles.resultMetrics}><div><span>Distancia objetivo</span><strong>{fmt(result.targetMm!)} <small>mm</small></strong><span>{fmt(parseSagInput(target))} % de {fmt(parseSagInput(length))} mm</span></div>
        <div><span>Lo que mediste</span><strong>{result.measuredPercent === undefined ? "—" : fmt(parseSagInput(measured))} <small>mm</small></strong><span>{result.measuredPercent === undefined ? "Agrega el dato 3" : `SAG medido: ${fmt(result.measuredPercent)} %`}</span></div></div>
        {result.measuredPercent !== undefined ? <>
          <p>{Math.abs(result.differenceMm!) < 0.05 ? "Tu medición coincide con el objetivo." : `${fmt(Math.abs(result.differenceMm!))} mm ${result.differenceMm! > 0 ? "por encima" : "por debajo"} del objetivo. ${result.differenceMm! > 0 ? "Hay más hundimiento del elegido." : "Hay menos hundimiento del elegido."}`}</p>
          {result.measuredPercent >= 50 && <p><b>Revisa la medición:</b> este hundimiento es muy alto frente a las referencias de esta guía. Comprueba recorrido, carrera y posición antes de cambiar ajustes.</p>}
          <p className={styles.resultFoot}>{suggestion.verified || manualTarget !== null ? "El SAG es un punto de partida. Comprueba cómo se siente la bici al pedalear y sigue las indicaciones de su manual." : "Estás comparando con un ejemplo. Busca tu modelo arriba o escribe el objetivo de tu manual para usarlo como referencia."} {(spring === "coil" || reference?.spring === "coil") && "La precarga no cambia la dureza del muelle. Si no logras el SAG dentro de su límite de precarga, puede hacer falta otro muelle."}</p>
        </> : <p>Agrega tu medición para comparar con el objetivo.</p>}
      </>}
    </div>
  </section>;
}

type SetupProps = { bike: string; setBike: (value: string) => void };

export function SagSetup({ bike, setBike }: SetupProps) {
  return <div>
    <fieldset className={styles.types}>
      <legend>Elige tu bicicleta</legend>
      {[ ["hardtail", "Hardtail", "Solo suspensión delantera"], ["full", "Doble suspensión", "Horquilla y amortiguador"] ].map(([value, label, detail]) => <label key={value} className={styles.choice}>
        <input type="radio" name="bike-sag" value={value} checked={bike === value} onChange={() => setBike(value)} /><span><b>{label}</b><small>{detail}</small></span>
      </label>)}
    </fieldset>
    <p className={styles.note}>En el siguiente paso podrás buscar el modelo de tu horquilla o amortiguador y ver su referencia oficial. Si no aparece, puedes escribir el objetivo de su manual.</p>
  </div>;
}

export function SagCalculator({ bike }: { bike: string }) {
  return <div>
      <h2 className={styles.stepTitle}>Calcula y compara</h2>
      <p className={styles.note}>Completa tres datos: recorrido o carrera, porcentaje objetivo y lo que mediste. No necesitas hacer las cuentas.</p>
      {bike === "full" && <p className={styles.note}>Haz una medición delante y otra detrás. Son dos suspensiones distintas: no copies el recorrido, la carrera ni el objetivo de una en la otra.</p>}
      <div className={styles.grid}><Suspension /><div className={styles.suspensionSlot} hidden={bike !== "full"}><Suspension rear /></div></div>
      <p className={styles.note}>El objetivo se toma de la referencia que elijas. Si el fabricante de tu bicicleta indica un valor específico, puedes escribirlo en «SAG objetivo».</p>
  </div>;
}

