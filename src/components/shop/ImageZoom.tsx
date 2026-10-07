"use client";

import { useRef } from "react";

export function ImageZoom({ src, name }: { src: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" className="tp-image-zoom-trigger" aria-label={`Ampliar imagen de ${name}`} onClick={() => dialog.current?.showModal()}>
      <span aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M10 7v6M7 10h6" /></svg></span>
    </button>
    <dialog ref={dialog} className="tp-image-zoom-dialog" aria-label={`Imagen ampliada de ${name}`} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button type="button" className="tp-image-zoom-close" onClick={() => dialog.current?.close()} autoFocus aria-label="Cerrar imagen ampliada">Cerrar ×</button>
      <img src={src} alt={name} />
    </dialog>
  </>;
}
