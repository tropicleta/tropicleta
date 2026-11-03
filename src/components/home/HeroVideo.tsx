"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import styles from "./HeroVideo.module.css";

const videoId = "gt6_Ru9TzqU";

type Player = {
  mute(): void;
  unMute(): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
  getIframe(): HTMLIFrameElement;
};
type YouTubeAPI = {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    playerVars: Record<string, string | number>;
    events: {
      onReady(event: { target: Player }): void;
      onStateChange(event: { data: number; target: Player }): void;
      onError(): void;
      onAutoplayBlocked(): void;
    };
  }) => Player;
};

export function HeroVideo() {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const ended = useRef(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    // Next Script may already be loaded when navigating back to the home page.
    const initialize = () => {
      const api = (window as Window & { YT?: YouTubeAPI }).YT;
      if (!api?.Player || !container.current || player.current) return false;
      const mount = document.createElement("div");
      container.current.appendChild(mount);
      player.current = new api.Player(mount, {
        videoId,
        playerVars: {
          autoplay: 0, mute: 1, controls: 0, playsinline: 1,
          rel: 0, disablekb: 1,
          origin: window.location.origin,
        },
        events: {
          onReady({ target }) {
            if (disposed) return;
            const iframe = target.getIframe();
            iframe.title = "Video de fondo de Tropicleta";
            iframe.tabIndex = -1;
            iframe.setAttribute("aria-hidden", "true");
            target.mute();
            setMuted(true);
            target.playVideo();
            setReady(true);
          },
          onStateChange({ data, target }) {
            if (disposed) return;
            if (data === 1 || data === 2 || data === 0) setPlaying(data === 1);
            if (data === 1) {
              ended.current = false;
              setVisible(true);
            } else if (data === 0) {
              ended.current = true;
              setVisible(false);
            }
          },
          onError() {
            if (disposed) return;
            setVisible(false);
            setFailed(true);
          },
          onAutoplayBlocked() {
            if (!disposed) setPlaying(false);
          },
        },
      });
      return true;
    };
    const interval = window.setInterval(() => {
      if (player.current || initialize()) window.clearInterval(interval);
    }, 100);
    initialize();
    const timeout = window.setTimeout(() => window.clearInterval(interval), 20000);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      player.current?.destroy();
      player.current = null;
    };
  }, []);

  function toggleAudio() {
    const current = player.current;
    if (!current) return;
    // YouTube sends commands to its iframe asynchronously. Reading isMuted()
    // immediately after a command still returns the previous value.
    const nextMuted = !muted;
    if (nextMuted) current.mute();
    else current.unMute();
    setMuted(nextMuted);
  }

  return (
    <>
      <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" onError={() => setFailed(true)} />
      <div className={styles.background} aria-hidden="true">
        <Image src="/taller/equipo-tropicleta.jpeg" alt="" fill sizes="100vw" preload className={styles.poster} />
        <div ref={container} className={`${styles.player} ${visible ? styles.visible : ""}`} />
      </div>
      <div className={styles.controls} aria-label="Controles del video de fondo">
        {failed ? <a href={`https://www.youtube.com/shorts/${videoId}`} target="_blank" rel="noopener noreferrer">Ver video en YouTube ↗</a> : <>
          <button type="button" disabled={!ready} onClick={() => {
            if (playing) player.current?.pauseVideo();
            else {
              if (ended.current) player.current?.seekTo(0, true);
              player.current?.playVideo();
            }
          }} aria-label={playing ? "Pausar video de fondo" : "Reproducir video de fondo"} title={playing ? "Pausar video" : "Reproducir video"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {playing ? <path d="M6 4h4v16H6zm8 0h4v16h-4z" /> : <path d="m8 4 12 8-12 8z" />}
            </svg>
          </button>
          <button type="button" onClick={toggleAudio} disabled={!ready} aria-pressed={!muted} aria-label={muted ? "Activar sonido" : "Silenciar video"} title={muted ? "Activar sonido" : "Silenciar video"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}
            </svg>
          </button>
        </>}
      </div>
    </>
  );
}
