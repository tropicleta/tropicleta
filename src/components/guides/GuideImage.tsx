import Image from "next/image";
import styles from "./GuideImage.module.css";

const illustrations: Record<string, { file: string; alt: string }> = {
  sillin: { file: "sillin", alt: "Ciclista sentado con la rodilla y la altura del sillín destacadas junto a un celular" },
  suspension: { file: "suspension", alt: "Horquilla de suspensión con una marca y una escala para observar el hundimiento" },
  "cada-cuanto-hacer-mantencion": { file: "cada-cuanto-hacer-mantencion", alt: "Bicicleta, llave de taller y calendario de mantención" },
  "tubeless-vale-la-pena": { file: "tubeless-vale-la-pena", alt: "Rueda de bicicleta con sellante en su interior y una espina junto al neumático" },
  "cuidar-la-cadena": { file: "cuidar-la-cadena", alt: "Eslabones de cadena, lubricante y paño de limpieza" },
  "revision-antes-de-salir": { file: "revision-antes-de-salir", alt: "Bicicleta, manómetro y lista de comprobaciones antes de salir" },
};

export function GuideImage({ guide }: { guide: string }) {
  const illustration = illustrations[guide];
  if (!illustration) return null;
  return <Image className={styles.image} src={`/guias/${illustration.file}.svg`} width={720} height={400} alt={illustration.alt} unoptimized />;
}
