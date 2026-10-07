"use client";

import { useState } from "react";
import { ProductMedia } from "./ProductMedia";

export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [selected, setSelected] = useState(0);
  return <div className="tp-product-gallery">
    <ProductMedia name={name} image={images[selected]} sizes="(max-width: 979px) 100vw, 560px" preload />
    {images.length > 1 && <div className="tp-gallery-thumbnails" aria-label="Fotos del producto">
      {images.map((src, index) => <button key={`${src}-${index}`} type="button" aria-label={`Ver foto ${index + 1} de ${name}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <img src={src} alt={`Foto ${index + 1} de ${name}`} loading="lazy" />
      </button>)}
    </div>}
  </div>;
}
