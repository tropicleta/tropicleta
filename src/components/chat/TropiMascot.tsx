"use client";

import Image from "next/image";
import { useId } from "react";
import { EYES } from "@/components/AnimatedEmblem";
import type { Emotion } from "@/lib/chat-emotions";

const REACTION: Record<Emotion, string> = {
  feliz: "♥",
  emocionado: "✦",
  pensando: "…",
  curioso: "?",
  apenado: "💧",
  guino: "😉",
};

/**
 * Mascota de Tropicleta con párpados animables (mismos trazos que el emblema del hero).
 * `emotion` cambia pose y ojos; `pulse` (un contador) re-dispara la reacción aunque la emoción se repita.
 */
export function TropiMascot({ emotion, pulse = 0, size = 56, reaction = true }: {
  emotion: Emotion;
  pulse?: number;
  size?: number;
  reaction?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <span className={`tp-tropi tp-tropi--${emotion}`} style={{ width: size, height: size }} aria-hidden="true">
      <span key={pulse} className="tp-tropi-body">
        <Image src="/brand/mascota-actualizada.webp" alt="" fill sizes={`${size}px`} />
        <svg className="tp-tropi-eyes" viewBox="0 0 1024 1024">
          <defs>
            {EYES.map((e) => (
              <clipPath key={e.id} id={`tp-tropi-eye-${uid}-${e.id}`}>
                <path d={e.clip} />
              </clipPath>
            ))}
          </defs>
          {EYES.map((e) => (
            <g key={e.id} className={`tp-tropi-eye tp-tropi-eye-${e.id}`} clipPath={`url(#tp-tropi-eye-${uid}-${e.id})`}>
              <g className="tp-tropi-lid-lo" style={{ "--open": `${e.h2}px` } as React.CSSProperties}>
                <path className="tp-emblem-lid-skin" d={e.lower} />
              </g>
              <g className="tp-tropi-lid-up" style={{ "--open": `${-e.h}px` } as React.CSSProperties}>
                <path className="tp-emblem-lid-skin" d={e.upper} />
                <path className="tp-emblem-lid-crease" d={e.crease} />
                <path className="tp-emblem-lid-edge" d={e.edge} />
              </g>
            </g>
          ))}
        </svg>
      </span>
      {reaction && (
        <span key={`r${pulse}`} className="tp-tropi-reaction">
          {REACTION[emotion]}
        </span>
      )}
    </span>
  );
}
