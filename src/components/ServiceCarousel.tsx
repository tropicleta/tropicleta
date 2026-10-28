"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./ServiceCarousel.module.css";
const slides = [
  { number: 1, title: "Servicios generales", href: "/servicios/#mantenciones" },
  { number: 4, title: "Retiro y entrega", href: "/servicios/" },
  { number: 8, title: "Scooters eléctricos", href: "/servicios/?vehiculo=scooter#scooters" },
  { number: 2, title: "Ruedas y tubeless", href: "/servicios/#ruedas" },
  { number: 3, title: "Suspensiones", href: "/servicios/#suspensiones" },
  { number: 5, title: "Ejes y rodamientos", href: "/servicios/#ejes" },
  { number: 6, title: "Transmisión", href: "/servicios/#frenos" },
];
export function ServiceCarousel() {
  const [position, setPosition] = useState<{ index: number; previousIndex: number | null; direction: "next" | "previous" }>({ index: 0, previousIndex: null, direction: "next" });
  const index = position.index;
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [interacting, setInteracting] = useState(false);
  const go = (direction: number) => setPosition(current => ({ index: (current.index + direction + slides.length) % slides.length, previousIndex: current.index, direction: direction > 0 ? "next" : "previous" }));
  useEffect(() => {
    if (interacting) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !touch.current) setPosition(current => ({ index: (current.index + 1) % slides.length, previousIndex: current.index, direction: "next" }));
    }, 6500);
    return () => window.clearInterval(timer);
  }, [interacting, index]);
  return <section className="tp-single-carousel" aria-label="Catálogo de servicios" aria-roledescription="carrusel"
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}
    onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); go(event.key === "ArrowRight" ? 1 : -1); } }}>
    <div id="service-carousel" className={styles.viewport} style={{ touchAction: "pan-y" }}
      onTouchStart={event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; swiped.current = false; setInteracting(true); }}
      onTouchEnd={event => { const start = touch.current; const end = event.changedTouches[0]; if (start && Math.abs(end.clientX - start.x) > 45 && Math.abs(end.clientX - start.x) > Math.abs(end.clientY - start.y)) { go(end.clientX < start.x ? 1 : -1); swiped.current = true; } touch.current = null; setInteracting(false); }}
      onTouchCancel={() => { touch.current = null; setInteracting(false); }}
      onClickCapture={event => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}>
      {slides.map((slide, slideIndex) => {
        const active = slideIndex === index;
        const leaving = slideIndex === position.previousIndex;
        const motion = position.previousIndex === null ? "" : active ? (position.direction === "next" ? styles.enterNext : styles.enterPrevious) : leaving ? (position.direction === "next" ? styles.exitNext : styles.exitPrevious) : "";
        return <article key={slide.number} className={`tp-single-card ${styles.card} ${active ? styles.active : leaving ? styles.leaving : ""} ${motion}`} aria-hidden={!active} inert={!active} aria-label={slideIndex + 1 + " de " + slides.length + ": " + slide.title} aria-roledescription="lámina" onAnimationEnd={() => {
          if (leaving) setPosition(current => current.previousIndex === slideIndex ? { ...current, previousIndex: null } : current);
        }}>
          <Link href={slide.href} className="tp-poster-crop" aria-label={"Ver " + slide.title}><Image src={slide.number === 4 ? "/catalogo/compacto/retiro-entrega.png" : slide.number === 1 ? "/catalogo/compacto/servicios-generales.jpg" : "/catalogo/compacto/" + slide.number + ".jpg"} alt={"Catálogo Tropicleta: " + slide.title} fill sizes="(max-width: 700px) 92vw, (max-width: 979px) 340px, 390px" loading={active ? "eager" : "lazy"} /></Link>
          <div className="tp-single-caption"><div className="tp-carousel-dots" aria-label="Elegir servicio">{slides.map((item, dotIndex) => <button key={item.number} type="button" onClick={() => setPosition(current => current.index === dotIndex ? current : { index: dotIndex, previousIndex: current.index, direction: dotIndex > current.index ? "next" : "previous" })} aria-label={`Ver ${item.title}`} aria-current={index === dotIndex ? "true" : undefined} aria-controls="service-carousel"><span /></button>)}</div><Link className="tp-btn tp-btn-primary" href={slide.href}>Ir a servicios y cotización →</Link></div>
        </article>;
      })}
    </div>
  </section>;
}
