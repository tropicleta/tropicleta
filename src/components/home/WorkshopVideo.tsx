"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./WorkshopIntro.module.css";

const videoUrl = "https://www.youtube.com/watch?v=1O98cXZ4-8A";
const posterUrl = "/taller/tutorial-tubeless.jpg";

export function WorkshopVideo() {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className={styles.video}>
      <div className={styles.player}>
        {playing ? (
          <video controls autoPlay playsInline preload="none" poster={posterUrl} aria-label="Tropicleta: cómo tubelizar la rueda de tu bicicleta">
            <source src="/taller/tutorial-tubeless.mp4" type="video/mp4" />
            Tu navegador no permite reproducir este video. <a href={videoUrl}>Ver tutorial en YouTube</a>.
          </video>
        ) : (
          <button type="button" className={styles.poster} onClick={() => setPlaying(true)} aria-label="Reproducir tutorial de tubeless de Tropicleta, 1 minuto y 30 segundos">
            <Image unoptimized src={posterUrl} alt="Portada del tutorial de tubeless de Tropicleta" fill sizes="(max-width: 700px) 280px, 300px" />
            <span className={styles.play} aria-hidden="true"><svg width="22" height="24" viewBox="0 0 22 24" fill="currentColor"><path d="M4 2 20 12 4 22Z" /></svg></span>
            <span className={styles.duration} aria-hidden="true">1:30</span>
          </button>
        )}
      </div>
      <figcaption className={styles.caption}>
        <strong>Tubeless, paso a paso.</strong>
        <span>Un trabajo explicado desde el taller.</span>
        <a href={videoUrl} target="_blank" rel="noopener noreferrer">Abrir en YouTube <span aria-hidden="true">↗</span></a>
      </figcaption>
    </figure>
  );
}
