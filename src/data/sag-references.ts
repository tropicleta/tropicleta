/** Official references reviewed 2026-10-08. Scope is explicit; never infer from brand alone. */
export type SagReference = {
  brand: string; label: string; rear: boolean; spring: "air" | "coil";
  range: readonly [number, number] | null; url: string; note: string;
};
const fox = "https://tech.ridefox.com/bike/owners-manuals/";
const marz = "https://cdn.shopify.com/s/files/1/0252/8700/0144/files/";
const foxFork = "Abre la compresión y mide con tu equipo habitual, siguiendo la posición del manual.";
const foxShock = "Confirma la carrera y la recomendación del cuadro. Prepara las cámaras de aire según el manual.";
const ohlins38 = "https://ohlins.com/storage/4D81EA83A21214EDFB4A57331844F3692B56F2CCA1ED9BD1BE95A5CDFE6D1B1E/9bd7e6402a3e42ff93f357c6b15e645b/pdf/media/0377e17f271d4af39560e027d515d36d/Owners%20manual%20RXF38%20m.2.pdf";
const ohlins36 = "https://www.ohlins.com/storage/5AE83FB930CA36F45700C32CCF7A91A96A7798B3D1C60B1AB10761D262BBE26B/24e7fcb03154439ea9ae0b6150bcede7/pdf/media/751e4a2b1cc24d338664758d74947fe0/Owner%27s%20manual%20RXF36m.3.pdf";
function entries(brand: string, labels: string[], rear: boolean, spring: "air" | "coil", range: readonly [number, number] | null, url: string, note: string): SagReference[] {
  return labels.map(label => ({ brand, label, rear, spring, range, url, note }));
}
export const sagReferences: SagReference[] = [
  ...entries("Manitou", ["Mara Pro PB Gen 2 · guía 2024"], true, "air", [25,30], "https://hayesbicycle.zendesk.com/hc/en-us/article_attachments/28476110600727", "Usa primero el SAG recomendado por el fabricante del cuadro. Esta guía propone 25–30 % solo si no hay esa recomendación. Equilibra las cámaras según Balance Groove."),
  ...entries("Öhlins", ["RXF36 m.3 Air · manual m.3"], false, "air", [10,15], ohlins36, "Rango aproximado para aire. Prepara primero ramp-up y después la cámara principal. Sigue el método de recuperación de longitud tras bajar presión."),
  ...entries("Öhlins", ["RXF36 m.3 Coil · manual m.3"], false, "coil", [15,20], ohlins36, "Rango aproximado para muelle. Confirma el muelle y prepara la precarga según el manual m.3."),
  ...entries("Manitou", ["Mezzer Pro Gen 2 · guía 2025", "Mezzer LT Pro Gen 2 · guía 2025"], false, "air", [20,25], "https://hayesbicycle.zendesk.com/hc/en-us/article_attachments/43742231652503", "Guía Gen 2: ajusta sin cargar la horquilla y presuriza IRT primero. La versión LT tiene recorridos y ajustes específicos; usa su columna en la tabla."),
  ...entries("Manitou", ["Mezzer Expert Gen 2 · guía Gen 2"], false, "air", [20,25], "https://hayesbicycle.zendesk.com/hc/en-us/article_attachments/41067689282071", "Usa la guía Expert Gen 2 y su procedimiento de medición. No copies la preparación de cámaras de la versión Pro."),
  ...entries("FOX", ["34SL · 2026"], false, "air", [15,20], `${fox}3087/fork--2026-34sl`, foxFork),
  ...entries("FOX", ["36SL · 2026"], false, "air", [15,20], `${fox}3088/fork--2026-36sl`, foxFork),
  ...entries("FOX", ["38 FLOAT / E-Bike+ / Rhythm · 2026"], false, "air", [15,20], `${fox}3103/fork--2026-38mm`, "El SAG es común a estas versiones; sus presiones y límites son distintos. Usa la tabla de tu versión."),
  ...entries("FOX", ["Podium · 2026"], false, "air", [15,20], `${fox}3108/fork--2026-podium-`, "Horquilla invertida. Identifica anillo y retén según su manual; no copies la dirección de una horquilla convencional."),
  ...entries("FOX", ["FLOAT SL · 2026", "FLOAT X · 2026"], true, "air", [25,30], `${fox}3098/shock--2026-float-sl-and-float-x`, foxShock),
  ...entries("FOX", ["FLOAT X2 · 2026"], true, "air", [30,30], `${fox}3023/shock--2026-float-x2`, "Referencia aproximada de 30 %. Usa el manual de 2026: la presión máxima y el procedimiento deben corresponder a esta generación."),
  ...entries("FOX", ["DHX · 2026"], true, "coil", [30,30], `${fox}3100/shock--2026-dhx-`, "Referencia aproximada. Mide entre anclajes con y sin tu peso; respeta los límites de precarga del manual."),
  ...entries("FOX", ["DHX2 · 2026"], true, "coil", [30,30], `${fox}3090/shock--2026-dhx2`, "Referencia aproximada de esta generación. Confirma el muelle y mide entre anclajes según el manual."),
  ...entries("Öhlins", ["RXF38 m.2 Air · manual m.2"], false, "air", [10,15], ohlins38, "Rango aproximado para aire, no para muelle. Prepara primero la cámara ramp-up y luego la principal, siguiendo el manual."),
  ...entries("Öhlins", ["RXF38 m.2 Coil · manual m.2"], false, "coil", [15,20], ohlins38, "Rango aproximado para muelle. Usa el procedimiento de precarga y la tabla de muelles del manual m.2."),
  ...entries("DVO", ["Topaz Prime · guía 2.1 / 2024", "Topaz Pro · guía 2.1 / 2024"], true, "air", [20,30], "https://dvosuspension.com/wp-content/uploads/2024/05/DVO-Topaz-Setup-Guide-May9-1.pdf", "Usa la carrera del amortiguador. La cámara principal y la cámara bladder tienen ajustes distintos: sigue la guía de tu versión."),
  ...entries("DVO", ["Diamond · guía Fork Set-Up", "Onyx SC · guía Fork Set-Up", "Onyx DC · guía Fork Set-Up", "Beryl · guía Fork Set-Up", "Sapphire 32 · guía Fork Set-Up", "Sapphire 34 · guía Fork Set-Up"], false, "air", [15,20], "https://tech.dvosuspension.com/wp-content/uploads/2018/08/DVO-SET-UP-GUIDE_fork.pdf", "Referencia de las familias descritas en esta guía. No extrapoles a nuevas versiones 36/38, SL o Core sin confirmar el manual. Ajusta OTT y presión siguiendo la secuencia de tu modelo."),
  ...entries("Manitou", ["Mezzer Pro · guía Pro"], false, "air", [20,25], "https://hayesbicycle.zendesk.com/hc/en-us/article_attachments/360056778633", "La guía Pro mide de pie, con 70 % del peso en pedales y 30 % en manillar. Sigue el orden de las cámaras principal e IRT. No extrapoles a Mezzer Gen 2 o LT."),
  ...entries("FOX", ["36 · 2024", "38 · 2024"], false, "air", [15,20], `${fox}2930/fork--2024-36mm-`, foxFork),
  ...entries("FOX", ["32 / Step-Cast / Taper-Cast · 2025", "34 / Step-Cast / Rhythm · 2025"], false, "air", [15,20], `${fox}2978/fork--2025-32mm--or-34mm-(including-step-cast-and-taper-cast)`, foxFork),
  ...entries("FOX", ["36 · 2025", "38 · 2025"], false, "air", [15,20], `${fox}2979/fork--2025-36mm-or-38mm`, foxFork),
  ...entries("FOX", ["40 FLOAT · 2025"], false, "air", [15,20], `${fox}2980/fork--2025-40mm`, foxFork),
  ...entries("FOX", ["FLOAT DPS · 2018", "FLOAT DPX2 · 2018"], true, "air", [25,30], `${fox}824/ownersmanuals`, foxShock),
  ...entries("FOX", ["FLOAT · 2025"], true, "air", [25,30], `${fox}2982/shock--2025-float`, foxShock),
  ...entries("FOX", ["FLOAT SL · 2025", "FLOAT X · 2025"], true, "air", [25,30], `${fox}2983/shock--2025-float-`, foxShock),
  ...entries("FOX", ["FLOAT X2 · 2025"], true, "air", [30,30], `${fox}2984/shock--2025-float-x2`, "El manual propone aproximadamente 30 %. No usa el rango de FLOAT X. Confirma también el cuadro."),
  ...entries("FOX", ["DHX · 2025", "DHX2 · 2025"], true, "coil", [30,30], `${fox}2981/shock--2025-all-coil-shocks-(dhx2-and-dhx-models)`, "Referencia aproximada. Mide la diferencia entre anclajes con y sin tu peso. La precarga tiene límites; no cambia la dureza del muelle."),
  ...entries("Marzocchi", ["Bomber Z2 · guía Rev. A"], false, "air", [15,20], `${marz}Bomber_Z2_Tuning_Guide-_RevA_Z2_TuningGuide.pdf?v=1659472859`, foxFork),
  ...entries("Marzocchi", ["Bomber Z1 · guía Rev. B"], false, "air", [15,20], `${marz}605-00-256_RevB_DJ-Z1_TuningGuide.pdf?v=1659471662`, foxFork),
  ...entries("Marzocchi", ["Bomber Z1 Coil · guía Rev. B"], false, "coil", [15,20], `${marz}605-00-256_RevB_DJ-Z1_TuningGuide.pdf?v=1659471662`, "Abre la compresión para medir y respeta los límites de precarga del manual."),
  ...entries("Marzocchi", ["Bomber Air · 2022 / Rev. A"], true, "air", [25,30], `${marz}605-00-269_REV_A_2022_Marzocchi_Bomber_Air_Shock_Owners_Guide_Rev_A_FINAL.pdf?v=1659473086`, foxShock),
  ...entries("Marzocchi", ["Bomber CR · guía Rev. A"], true, "coil", [30,30], `${marz}605-00-205_Marzocchi-BomberCR-Tuning-Guide-white-RevA.pdf?v=1659473086`, "Mide la diferencia entre anclajes con y sin tu peso. Confirma el muelle y los límites de precarga en el manual."),
  ...entries("SR Suntour", ["DUROLUX38 EQ · guía 2022"], false, "air", [25,35], "https://www.srsuntour.com/uploads/pics/SRS-2205-Lookbook-Durolux38_B2C_Final.pdf", "Referencia específica de DUROLUX38 EQ con 160, 170 o 180 mm. No la apliques a otras DUROLUX o a otras versiones."),
  ...entries("RockShox", ["Pike · DebonAir+", "Lyrik · DebonAir+", "ZEB · DebonAir+"], false, "air", null, "https://www.sram.com/globalassets/document-hierarchy/tuning-manuals/suspension-setup-and-tuning-guide-english.pdf", "Para DebonAir+, RockShox no exige ajustar por porcentaje de SAG. Busca tu número de serie en TrailHead, parte de su presión y sigue el manual. El porcentaje de abajo sirve solo para comparar una medición."),
  ...entries("RockShox", ["Vivid Air · guía de ajuste Vivid"], true, "air", [30,30], "https://www.sram.com/en/rockshox/rockshox-technology/vivid-air-setup", "La guía propone 30 %. Confirma que tu versión coincide y sigue su procedimiento de equilibrado de cámaras."),
  ...entries("RockShox", ["Amortiguador Solo Air · guía general"], true, "air", [25,25], "https://support.rockshox.com/hc/en-us/articles/4412440335643-How-much-air-should-I-have-in-my-RockShox-rear-shock-for-my-rider-weight", "Guía general para la cámara Solo Air, no para cualquier modelo o generación. Confirma la cámara, la versión y el objetivo del cuadro."),
  ...entries("RockShox", ["Amortiguador DebonAir · guía general"], true, "air", [30,30], "https://support.rockshox.com/hc/en-us/articles/4412440335643-How-much-air-should-I-have-in-my-RockShox-rear-shock-for-my-rider-weight", "Guía general para la cámara DebonAir. No la apliques automáticamente a DebonAir+, Solo Air o cualquier generación de Deluxe, Super Deluxe o Monarch. Confirma tu versión y el cuadro."),
];

export function findSagReference(brand: string, label: string, rear: boolean, spring: string) {
  return sagReferences.find(item => item.brand === brand && item.label === label && item.rear === rear && (spring === "unknown" || item.spring === spring));
}
