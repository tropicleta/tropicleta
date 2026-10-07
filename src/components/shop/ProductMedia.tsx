import Image from "next/image";
import { ImageZoom } from "./ImageZoom";

type Props = { name: string; image?: string | null; badge?: React.ReactNode; sizes?: string; preload?: boolean; zoom?: boolean };

// Optimizables por next/image: archivos locales y Vercel Blob (ver images.remotePatterns en next.config.ts).
// Cualquier otra URL externa pegada en el panel se sirve tal cual.
const optimizable = (src: string) => src.startsWith("/") || /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(src);

/** Imagen del producto o, si no hay foto aún, un placeholder con la inicial en estilo Tropicleta. */
export function ProductMedia({ name, image, badge, sizes = "(max-width: 639px) 50vw, 280px", preload, zoom = false }: Props) {
  return (
    <div className="tp-product-media">
      {image ? (
        <><Image src={image} alt={name} fill sizes={sizes} preload={preload} unoptimized={!optimizable(image)} />{zoom && <ImageZoom key={image} src={image} name={name} />}</>
      ) : (
        <span className="tp-product-initial" aria-hidden="true">
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      {badge}
    </div>
  );
}
