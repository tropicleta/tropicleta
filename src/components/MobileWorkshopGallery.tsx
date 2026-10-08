"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const videos = [
  { id: "Dcran3kSBDX", title: "Mecánica exprés en Little MTB", description: "Ajustes en terreno y apoyo a los ciclistas junto a Academia ROTS y Club Deportivo Camélidos." },
  { id: "DcrXM9jSCuU", title: "Una jornada en Little MTB", description: "Bicicletas, familias y comunidad compartiendo una nueva experiencia sobre dos ruedas." },
  { id: "DcaRGHSNapo", title: "Tropicleteros en Atacama Desert Race", description: "Los momentos de un encuentro que nos reunió en el desierto de Atacama." },
  { id: "DcaHBq6NfhB", title: "Así vivimos Atacama Desert Race", description: "Un recorrido por la jornada organizada por Team Mugres." },
  { id: "Db0qbwOx5x9", title: "Reconocimiento de la carrera", description: "En ruta durante el reconocimiento de Atacama Desert Race." },
  { id: "DbgaWlXxZdZ", title: "Mecánica en Complejo Candelaria", description: "Ajustes gratuitos para acompañar una jornada deportiva de la comunidad." },
  { id: "DZNK5z0RR43", title: "Mecánica comunitaria en El Escorial", description: "Una jornada de apoyo a las bicicletas de Tierra Amarilla junto a la Oficina de Juventudes, Cultura y Patrimonio." },
];

export function MobileWorkshopGallery() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touch = useRef<{x:number;y:number} | null>(null);
  const go = (direction: number) => setIndex(current => (current + direction + videos.length) % videos.length);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener("change", update);
    const stop = () => setPaused(true);
    window.addEventListener("blur", stop);
    return () => { media.removeEventListener("change", update); window.removeEventListener("blur", stop); };
  }, []);
  useEffect(() => {
    if (paused || interacting || reducedMotion) return;
    const timer = window.setInterval(() => { if (!document.hidden) setIndex(current => (current + 1) % videos.length); }, 8500);
    return () => window.clearInterval(timer);
  }, [paused, interacting, reducedMotion, index]);
  const video = videos[index];
  const url = `https://www.instagram.com/reel/${video.id}/`;
  const thumbnail = `/taller/eventos/${video.id}.jpg`;
  const swiped = useRef(false);
  return <section className="tp-event-example" aria-label="Ejemplos del taller móvil" aria-roledescription="carrusel"
        onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
        onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}
        onTouchStart={event => { const point = event.touches[0]; touch.current = { x:point.clientX,y:point.clientY }; swiped.current = false; setInteracting(true); }}
        onTouchEnd={event => { const start = touch.current; const end = event.changedTouches[0]; if (start && Math.abs(end.clientX - start.x) > 45 && Math.abs(end.clientX - start.x) > Math.abs(end.clientY - start.y)) { go(end.clientX < start.x ? 1 : -1); swiped.current = true; } touch.current = null; setInteracting(false); }}
        onTouchCancel={() => { touch.current = null; setInteracting(false); }}
        onClickCapture={event => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}
        onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); go(event.key === "ArrowRight" ? 1 : -1); } }}
        >
      <div className="tp-carousel-dots" aria-label="Elegir evento">{videos.map((item, position) => <button type="button" key={item.id} onClick={() => setIndex(position)} aria-label={`Ver ${item.title}`} aria-current={position === index ? "true" : undefined}><span /></button>)}</div>
      <article className="tp-instagram-post tp-example-card">
        <div className="tp-instagram-post-header"><Image src="/brand/mascota-actualizada.webp" alt="" width={32} height={32} /><span><strong>tropicleta</strong><small>Taller móvil en acción</small></span><span className="tp-instagram-open" aria-hidden="true">↗</span></div>
        <a className="tp-example-preview" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Ver video: ${video.title}`}><Image src={thumbnail} alt={video.title} fill sizes="(max-width: 700px) 85vw, 340px" /><span className="tp-example-play" aria-hidden="true">▶</span></a>
        <div className="tp-workshop-caption"><h3>{video.title}</h3><p>{video.description}</p><a className="tp-mobile-video-link" href={url} target="_blank" rel="noopener noreferrer">Ver video en Instagram ↗</a></div>
      </article>
      <div className="tp-single-footer"><span>Ejemplos en terreno</span>{!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? "Reanudar" : "Pausar"}</button>}</div>
  </section>;
}
