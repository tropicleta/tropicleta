import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { siteUrl } from "@/lib/site-url";
import { SuspensionGuide } from "./SuspensionGuide";
import styles from "./sag.module.css";
import { sagReferences } from "@/data/sag-references";

export const metadata: Metadata = {
  title: "Ajusta tu suspensión: SAG y rebote",
  description: "Aprende a configurar tu suspensión en tres pasos: prepara tu bici, calcula el SAG y afina el rebote con una prueba práctica.",
  alternates: { canonical: siteUrl("/calculador-sag/") },
};

export default function SagPage() {
  return <>
    <PageHero kicker="Aprende con tu bici" title="Ajusta tu" highlight="suspensión." intro="Aprende cuánto se hunde al subirte y cómo vuelve después de un bache. Te acompañamos paso a paso." />
    <section className="tp-section"><div className="tp-shell">
      <p className={styles.purpose}>Una primera aproximación gratuita para entender tu suspensión a tu ritmo. Los objetivos y ajustes son orientativos; se recomienda una sesión con un profesional para una puesta a punto personalizada.</p>
      <div id="sag-calculator" className={styles.calculatorAnchor}><SuspensionGuide /></div>
      <details className={styles.details}><summary>Profundizar: medición, rangos y fuentes</summary>
      <div className={styles.supportGrid}><section className={styles.guide} aria-labelledby="sag-measure">
        <span className="tp-kicker">Paso a paso</span><h2 id="sag-measure" className="tp-display">Cómo medir el hundimiento</h2>
        <ol className={styles.steps}>
          <li>Confirma el recorrido de horquilla y la carrera de amortiguador en sus fichas técnicas. Abre el bloqueo y prepara los diales de compresión y rebote para medir según el manual del modelo.</li>
          <li>Ponte casco, zapatillas, mochila y el equipo que usas al pedalear. Apóyate en alguien o en una pared para mantener el equilibrio.</li>
          <li>Sube a la bicicleta y adopta la posición de conducción que indique el fabricante. Deja que la suspensión se asiente; FOX indica al menos 10 segundos para las 36/38 citadas.</li>
          <li>Sin cambiar de posición, lleva el anillo de goma hasta el retén de la horquilla o del amortiguador. Pide ayuda si no puedes alcanzarlo.</li>
          <li>Baja suavemente, sin rebotar. Con la suspensión extendida, mide desde el retén hasta el anillo: esos milímetros son el hundimiento que debes ingresar. Repite para comprobar consistencia.</li>
          <li>Si necesitas ajustar, sigue el manual: en aire usa una bomba de suspensión, respeta límites y ecualiza las cámaras cuando corresponda. En resorte, revisa la dureza del muelle y los límites de precarga. Vuelve a medir después de cada cambio.</li>
        </ol>
      </section>
      <section className={styles.guide} aria-labelledby="sag-reference">
        <span className="tp-kicker">Referencias oficiales</span><h2 id="sag-reference" className="tp-display">El objetivo depende de tu suspensión</h2>
        <p>Consulta el manual de tu suspensión y la recomendación de tu bicicleta. El uso y tus preferencias ayudan a afinar después ese punto de partida.</p>
        <details className={styles.details}><summary>Ver referencias por modelo y versión</summary>
        <div className={styles.tableWrap}><table><caption>Rangos de referencia y su alcance</caption><thead><tr><th scope="col">Fabricante / aplicación</th><th scope="col">SAG</th><th scope="col">Alcance</th></tr></thead><tbody>
          {sagReferences.map(item => <tr key={`${item.brand}-${item.label}`}><td><a href={item.url} target="_blank" rel="noopener noreferrer">{item.brand} {item.label}</a></td><td>{item.range ? item.range[0] === item.range[1] ? `${item.range[0]} %` : `${item.range[0]}–${item.range[1]} %` : "Usa presión / TrailHead"}</td><td>{item.rear ? "Amortiguador; % de carrera" : "Horquilla; % de recorrido"}. {item.spring === "coil" ? "Muelle" : "Aire"}.</td></tr>)}
        </tbody></table></div>
        <p>Cada referencia corresponde a la versión indicada. En rangos usamos el punto medio como propuesta editable; los valores únicos son puntos de partida del fabricante. Para DebonAir+ de horquilla, sigue su método de presión. Una doble suspensión requiere dos mediciones independientes.</p>
        </details>
        <details className={styles.details}><summary>Fuentes y límites del cálculo</summary>
        <ul>
          <li><a href="https://tech.ridefox.com/bike/owners-manuals/2930/fork--2024-36mm-" target="_blank" rel="noopener noreferrer">FOX: manual de horquillas 36 / 38 de 2024</a></li>
          <li><a href="https://tech.ridefox.com/bike/owners-manuals/824/ownersmanuals" target="_blank" rel="noopener noreferrer">FOX: manual FLOAT DPS / DPX2 de 2018</a></li>
          <li><a href="https://tech.ridefox.com/bike/list/owners-manuals" target="_blank" rel="noopener noreferrer">FOX: buscador oficial de manuales por año</a></li>
          <li><a href="https://bike.marzocchi.com/pages/product-service-manuals" target="_blank" rel="noopener noreferrer">Marzocchi: guías de ajuste y manuales</a></li>
          <li><a href="https://trailhead.rockshox.com/" target="_blank" rel="noopener noreferrer">RockShox TrailHead: busca por número de serie</a></li>
          <li><a href="https://www.srsuntour.com/support/product-support/owners-manuals/" target="_blank" rel="noopener noreferrer">SR Suntour: biblioteca de manuales</a></li>
          <li><a href="https://www.sram.com/en/rockshox/rockshox-technology/vivid-air-setup" target="_blank" rel="noopener noreferrer">RockShox: preparación y ecualización específica de Vivid Air</a></li>
          <li><a href="https://www.sram.com/en/rockshox/learn/suspension-fine-tuning" target="_blank" rel="noopener noreferrer">RockShox: rebote, compresión y ajuste fino</a></li>
          <li><a href="https://tech.ridefox.com/bike/owners-manuals/1146/shock--2022-all-coil-shocks-%28dhx2-and-dhx-models%29" target="_blank" rel="noopener noreferrer">FOX DHX / DHX2 (2022): medición entre ejes y límites de precarga</a></li>
        </ul>
        <p>Fuentes consultadas el 8 de octubre de 2026. La conversión matemática usa tus datos. La posición, fricción y geometría influyen en la medición. El porcentaje trasero corresponde al amortiguador: no predice el desplazamiento de rueda, cuya relación puede variar durante el recorrido.</p>
        <p>La calculadora no determina presión de aire a partir del peso ni un número universal de clics de rebote o compresión. Para presión inicial necesitas la tabla del modelo, año y fabricante; el peso por sí solo no basta.</p>
        </details>
      </section></div></details>
    </div></section>
  </>;
}

