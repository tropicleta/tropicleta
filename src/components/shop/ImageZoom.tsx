"use client";

import { useRef, useState, type PointerEvent } from "react";

export function ImageZoom({ src, name }: { src: string; name: string }) {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const gesture = useRef({ x: 0, y: 0, dragged: false });
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({ x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)) });
  };
  return <button type="button" className={`tp-inline-zoom${active ? " is-active" : ""}`} aria-label={`${active ? "Desactivar" : "Activar"} zoom de ${name}`} aria-pressed={active}
    onClick={event => { if (event.detail === 0 || !gesture.current.dragged) setActive(value => !value); }}
    onKeyDown={event => { if (event.key === "Escape") setActive(false); }}
    onPointerDown={event => { gesture.current = { x: event.clientX, y: event.clientY, dragged: false }; move(event); if (active) event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={event => { if (!active) return; if (event.buttons && Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 5) gesture.current.dragged = true; move(event); }}
    style={{ touchAction: active ? "none" : "pan-y" }}>
    {active && <img src={src} alt="" aria-hidden="true" draggable={false} style={{ transform: "scale(2.5)", transformOrigin: `${position.x}% ${position.y}%` }} />}
  </button>;
}
