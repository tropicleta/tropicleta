"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// Ojos en coordenadas de la mascota actualizada (1024×1024).
// Al pestañear el párpado superior (`upper`, con pliegue `crease`) baja `h` y el inferior (`lower`) sube `h2`;
// se juntan en `edge`, la línea de pestaña del ojo cerrado.
export const EYES = [
  {
    id: "l",
    clip: "M350 593C344 562 345 518 366 493L383 477C415 478 451 526 454 558L449 596Z",
    upper: "M330 460H470V570Q400 590 330 570Z",
    lower: "M330 570Q400 590 470 570V620H330Z",
    edge: "M345 570Q400 590 458 570",
    crease: "M363 536Q404 547 440 536",
    h: 104,
    h2: 40,
    hit: { cx: 400, cy: 545, rx: 62, ry: 62 },
  },
  {
    id: "r",
    clip: "M568 610L564 564C580 541 604 522 622 516C641 546 642 582 637 612Z",
    upper: "M550 500H652V591Q600 611 550 591Z",
    lower: "M550 591Q600 611 652 591V636H550Z",
    edge: "M560 591Q603 611 645 591",
    crease: "M577 562Q610 570 634 560",
    h: 100,
    h2: 30,
    hit: { cx: 605, cy: 568, rx: 48, ry: 60 },
  },
] as const;

// Emblema del hero separado en capas (anillo SVG, texto, rayos y mascota) para animarlas por separado.
// Las capas salen de /public/brand/tropicleta-emblema.jpeg y calzan 1:1 con el original.
export function AnimatedEmblem() {
  const ref = useRef<HTMLDivElement>(null);
  const lids = useRef<(SVGGElement | null)[]>([]);

  // Pestañeo al pasar el cursor (o tocar) sobre cualquiera de los ojos: cierran los dos, como un perro de verdad
  const blink = () => {
    lids.current.forEach((lid, n) => {
      if (!lid || lid.getAnimations().length) return;
      const eye = EYES[n >> 1];
      const open = n % 2 ? `translateY(${eye.h2}px)` : `translateY(${-eye.h}px)`;
      lid.animate(
        [
          { transform: open, easing: "cubic-bezier(.55, 0, .9, .45)" },
          { transform: "translateY(0)", offset: 0.42 },
          { transform: "translateY(0)", offset: 0.56, easing: "cubic-bezier(.2, .6, .35, 1)" },
          { transform: open },
        ],
        { duration: 340 },
      );
    });
  };

  // Pausa las animaciones infinitas (halo, cadena, rayos, brillo) cuando el emblema sale de pantalla
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => el.toggleAttribute("data-paused", !entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Inclinación 3D siguiendo el puntero (solo mouse/trackpad y sin reduced-motion)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!mq.matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--tilt-x", `${(-y * 10).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(x * 10).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="tp-emblem" role="img" aria-label="Tropicleta · Taller de bicicletas">
      <div className="tp-emblem-stage" aria-hidden="true">
        <div className="tp-emblem-disc" />

        <svg className="tp-emblem-rings" viewBox="0 0 1600 1600">
          <circle className="tp-emblem-chain" cx="800" cy="800" r="738" />
          <circle className="tp-emblem-ring" cx="800" cy="800" r="785" pathLength="100" />
        </svg>

        <div className="tp-emblem-text">
          <Image src="/brand/anim/texto.webp" alt="" fill sizes="(max-width: 719px) 280px, (max-width: 979px) 360px, 440px" preload />
        </div>

        <div className="tp-emblem-bolt tp-emblem-bolt-l">
          <Image src="/brand/anim/rayo-izq.webp" alt="" fill sizes="60px" />
        </div>
        <div className="tp-emblem-bolt tp-emblem-bolt-r">
          <Image src="/brand/anim/rayo-der.webp" alt="" fill sizes="60px" />
        </div>

        <div className="tp-emblem-mascot">
          <div className="tp-emblem-mascot-idle">
            <Image src="/brand/mascota-actualizada.webp" alt="" fill sizes="(max-width: 719px) 170px, (max-width: 979px) 220px, 270px" preload />
            <svg className="tp-emblem-eyes" viewBox="0 0 1024 1024">
              <defs>
                {EYES.map((e) => (
                  <clipPath key={e.id} id={`tp-eye-${e.id}`}>
                    <path d={e.clip} />
                  </clipPath>
                ))}
              </defs>
              {EYES.map((e, i) => (
                <g key={e.id} clipPath={`url(#tp-eye-${e.id})`}>
                  <g ref={(el) => { lids.current[i * 2 + 1] = el; }} style={{ transform: `translateY(${e.h2}px)` }}>
                    <path className="tp-emblem-lid-skin" d={e.lower} />
                  </g>
                  <g ref={(el) => { lids.current[i * 2] = el; }} style={{ transform: `translateY(${-e.h}px)` }}>
                    <path className="tp-emblem-lid-skin" d={e.upper} />
                    <path className="tp-emblem-lid-crease" d={e.crease} />
                    <path className="tp-emblem-lid-edge" d={e.edge} />
                  </g>
                </g>
              ))}
              {EYES.map((e) => (
                <ellipse key={e.id} className="tp-emblem-eye-hit" {...e.hit} onPointerEnter={blink} />
              ))}
            </svg>
          </div>
        </div>

        <div className="tp-emblem-shine" />
      </div>
    </div>
  );
}
