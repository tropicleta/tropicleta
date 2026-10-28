"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { SocialIcon } from "@/components/SocialIcon";
import { workshopComments } from "@/data/workshop-comments";
import styles from "./SocialFeedback.module.css";

export function SocialFeedback() {
  const gesture = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reading, setReading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ index: number; previousIndex: number | null; direction: "next" | "previous" }>({ index: 0, previousIndex: null, direction: "next" });
  const autoPlaying = !paused && !reading && !hovered && visible;
  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!autoPlaying) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !gesture.current) setPosition((current) => ({ index: (current.index + 1) % workshopComments.length, previousIndex: current.index, direction: "next" }));
    }, 6500);
    return () => window.clearInterval(timer);
  }, [autoPlaying, position.index]);
  function move(step: number) {
    setPosition((current) => ({ index: (current.index + step + workshopComments.length) % workshopComments.length, previousIndex: current.index, direction: step > 0 ? "next" : "previous" }));
  }
  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      gesture.current = null;
      return;
    }
    if (event.pointerType === "mouse" || (event.target as Element).closest("a, button")) return;
    gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaY = event.clientY - start.y;
    const deltaX = event.clientX - start.x;
    if (Math.abs(deltaY) >= 48 && Math.abs(deltaY) > Math.abs(deltaX) * 1.25) move(deltaY < 0 ? 1 : -1);
  }
  return (
    <section id="comentarios" className={`tp-section ${styles.section}`} aria-labelledby="feedback-title">
      <div className={`tp-shell ${styles.layout}`}>
        <div className={styles.heading}>
          <div>
            <h2 id="feedback-title">Lo que dicen del taller.</h2>
            <p>Comentarios públicos, con enlace a la publicación original.</p>
          </div>
        </div>
        <div ref={carouselRef} className={styles.carousel} role="region" aria-roledescription="carrusel" aria-label="Comentarios en redes sociales" onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setReading(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setReading(false); }}>
          <div className={styles.window} onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { gesture.current = null; }} onLostPointerCapture={() => { gesture.current = null; }}>
            {workshopComments.map((comment, index) => {
              const active = index === position.index;
              const leaving = index === position.previousIndex;
              const motion = active ? (position.direction === "next" ? styles.next : styles.previous) : leaving ? (position.direction === "next" ? styles.exitNext : styles.exitPrevious) : "";
              return <article key={`${comment.username}-${comment.url}`} className={`${styles.comment} ${active ? styles.active : leaving ? styles.leaving : ""} ${motion}`} aria-roledescription="diapositiva" aria-label={`${index + 1} de ${workshopComments.length}`} aria-hidden={!active} inert={!active} onAnimationEnd={() => {
                if (leaving) setPosition((current) => current.previousIndex === index ? { ...current, previousIndex: null } : current);
              }}>
              <header className={styles.author}>
                <span className={styles.avatar} aria-hidden="true">{comment.username.slice(0, 2).toUpperCase()}</span>
                <div className={styles.identity}><strong>@{comment.username}</strong>{comment.date ? <time dateTime={comment.date}>{comment.dateLabel}</time> : <span>{comment.dateLabel}</span>}</div>
                <span className={`${styles.platform} ${comment.platform === "Instagram" ? styles.instagram : styles.tiktok}`} title={comment.platform}><SocialIcon name={comment.platform} /><span className={styles.platformName}>{comment.platform}</span></span>
              </header>
              <blockquote cite={comment.url}><p>{comment.quote}</p></blockquote>
              <footer className={styles.source}>
                <p>{comment.context}</p>
                <a href={comment.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${comment.platform === "TikTok" ? "video" : "publicación"} original con el comentario de @${comment.username} en ${comment.platform}`}>
                  {comment.platform === "TikTok" ? "Ver video original" : "Ver publicación original"} <span aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>;
            })}
            <div className={styles.dots} role="group" aria-label="Elegir comentario">
              {workshopComments.map((item, index) => <button key={`${item.username}-dot`} type="button" className={styles.dot} aria-label={`Ver comentario ${index + 1} de @${item.username}`} aria-current={position.index === index ? "true" : undefined} onClick={() => setPosition((current) => current.index === index ? current : { index, previousIndex: current.index, direction: index > current.index ? "next" : "previous" })}><span /></button>)}
            </div>
            <button type="button" className={styles.pause} aria-label={paused ? "Reanudar carrusel automático" : "Pausar carrusel automático"} aria-pressed={paused} onClick={() => { setPaused((current) => !current); setReading(false); }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">{paused ? <path d="M4 2 14 8 4 14Z" /> : <path d="M3 2h4v12H3zM10 2h4v12h-4z" />}</svg>
            </button>
          </div>
          <span className={styles.srOnly} aria-live={autoPlaying ? "off" : "polite"} aria-atomic="true">Comentario {position.index + 1} de {workshopComments.length}</span>
        </div>
      </div>
    </section>
  );
}
