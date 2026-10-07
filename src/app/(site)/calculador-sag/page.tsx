import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { siteUrl } from "@/lib/site-url";
import { SagCalculator } from "./SagCalculator";
import styles from "./sag.module.css";

export const metadata: Metadata = {
  title: "Calculador de SAG de suspensión",
  description: "Calcula el SAG objetivo y medido de tu horquilla y amortiguador. Guía para bicicletas hardtail y doble suspensión con referencias de fabricantes.",
  alternates: { canonical: siteUrl("/calculador-sag/") },
};

export default function SagPage() {
  return <>
    <PageHero kicker="Ajusta tu bicicleta" title="Calculador de" highlight="SAG." intro="El SAG es cuánto se hunde la suspensión con tu peso y equipo en posición de conducción. Convierte tu objetivo en milímetros y compáralo con tu medición." />
    <section className="tp-section"><div className="tp-shell">
      <SagCalculator />
      <div className={styles.supportGrid}><section className={styles.guide} aria-labelledby="sag-measure">
        <span className="tp-kicker">Paso a paso</span><h2 id="sag-measure" className="tp-display">Cómo medir el hundimiento</h2>
        <ol className={styles.steps}>
          <li>Confirma el recorrido de horquilla y la carrera de amortiguador en sus fichas técnicas. Abre el bloqueo y ajusta la compresión para medir según el manual del modelo.</li>
          <li>Ponte casco, zapatillas, mochila y el equipo que usas al pedalear. Apóyate en alguien o en una pared para mantener el equilibrio.</li>
          <li>Sube a la bicicleta y adopta la posición de conducción que indique el fabricante. Deja que la suspensión se asiente; FOX indica al menos 10 segundos para las 36/38 citadas.</li>
          <li>Sin cambiar de posición, lleva el anillo de goma hasta el retén de la horquilla o del amortiguador. Pide ayuda si no puedes alcanzarlo.</li>
          <li>Baja suavemente, sin rebotar. Con la suspensión extendida, mide desde el retén hasta el anillo: esos milímetros son el hundimiento que debes ingresar. Repite para comprobar consistencia.</li>
          <li>Si necesitas ajustar, sigue el manual: en aire usa una bomba de suspensión, respeta límites y ecualiza las cámaras cuando corresponda. En resorte, revisa la dureza del muelle y los límites de precarga. Vuelve a medir después de cada cambio.</li>
        </ol>
      </section>
      <section className={styles.guide} aria-labelledby="sag-reference">
        <span className="tp-kicker">Referencias oficiales</span><h2 id="sag-reference" className="tp-display">El objetivo depende de tu suspensión</h2>
        <p>Consulta primero el manual de tu modelo. La disciplina sirve como referencia inicial, pero no define un objetivo universal.</p>
        <details className={styles.details}><summary>Ver rangos por modelo y disciplina</summary>
        <div className={styles.tableWrap}><table><caption>Rangos de referencia y su alcance</caption><thead><tr><th scope="col">Fabricante / aplicación</th><th scope="col">SAG</th><th scope="col">Alcance</th></tr></thead><tbody>
          <tr><td>FOX 36 / 38 (2024)</td><td>15–20 %</td><td>Horquilla; rango propio de esos modelos</td></tr>
          <tr><td>FOX FLOAT DPS / DPX2 (2018)</td><td>25–30 %</td><td>Amortiguador; porcentaje de su carrera</td></tr>
          <tr><td>SIMPLON: XC / maratón</td><td>20–25 %</td><td>Referencia general por disciplina</td></tr>
          <tr><td>SIMPLON: all mountain / trail</td><td>25–30 %</td><td>Referencia general por disciplina</td></tr>
          <tr><td>SIMPLON: enduro</td><td>25–35 %</td><td>Referencia general por disciplina</td></tr>
          <tr><td>SIMPLON: freeride / downhill</td><td>30–40 %</td><td>Referencia general por disciplina</td></tr>
        </tbody></table></div>
        <p>Los rangos generales de SIMPLON no sustituyen el objetivo específico de tu modelo. Una doble suspensión requiere dos mediciones independientes.</p>
        </details>
        <details className={styles.details}><summary>Fuentes y límites del cálculo</summary>
        <ul>
          <li><a href="https://tech.ridefox.com/bike/owners-manuals/2930/fork--2024-36mm-" target="_blank" rel="noopener noreferrer">FOX: manual de horquillas 36 / 38 de 2024</a></li>
          <li><a href="https://tech.ridefox.com/bike/owners-manuals/824/ownersmanuals" target="_blank" rel="noopener noreferrer">FOX: manual FLOAT DPS / DPX2 de 2018</a></li>
          <li><a href="https://www.simplon.com/en/About-us/Magazine/How-to-adjust-your-MTB-s-suspension_bba_10490" target="_blank" rel="noopener noreferrer">SIMPLON: guía de ajuste por disciplina (2025)</a></li>
        </ul>
        <p>Fuentes consultadas el 7 de octubre de 2026. La conversión matemática usa tus datos; la elección del objetivo y la medición son aproximadas. La posición, fricción y geometría influyen. El porcentaje trasero corresponde al amortiguador: no predice el desplazamiento de rueda, cuya relación puede variar durante el recorrido.</p>
        <p>Esta herramienta no calcula presión de aire a partir del peso ni ajustes de rebote o compresión. Para presión inicial necesitas la tabla del modelo, año y fabricante; el peso por sí solo no basta.</p>
        </details>
        <Link href="/contacto/" className="tp-btn tp-btn-primary">Pedir ayuda al taller</Link>
      </section></div>
    </div></section>
  </>;
}
