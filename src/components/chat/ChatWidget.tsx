"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { EMOTION_LABEL, type Emotion } from "@/lib/chat-emotions";
import { WA_CONSULTAR } from "@/lib/whatsapp";
import { TropiMascot } from "./TropiMascot";

type Msg = { role: "user" | "assistant"; content: string; emotion?: Emotion };

const HELLO: Msg = {
  role: "assistant",
  content: "¡Guau, hola! 🐾 Soy Tropi, el asistente de Tropicleta. Cuéntame qué le pasa a tu bici o qué andas buscando y te ayudo al tiro.",
  emotion: "emocionado",
};
const ERROR_MSG = "Uf, se me cortó la cadena 😅. Inténtalo de nuevo o escríbenos por WhatsApp.";
const SUGGESTIONS = [
  "¿Cuánto cuesta una mantención?",
  "Quiero agendar hora",
  "Mi bici hace ruido al pedalear",
  "¿Hacen despacho a Copiapó?",
];


// Rutas internas (/servicios/x/) y enlaces de WhatsApp dentro de las respuestas → enlaces reales.
// Sin lookbehind `(?<!…)`: Safari < 16.4 lo rechaza al parsear y rompe todo el JS de la página.
// El carácter previo se captura aparte ($1) para no enlazar rutas pegadas a una palabra o dominio.
const LINK_RE = /(^|[^\w.])(https:\/\/wa\.me\/[^\s)]+|\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)?)/gi;

function RichText({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const start = m.index + m[1].length;
    const link = m[2];
    out.push(text.slice(last, start));
    out.push(
      link.startsWith("https://") ? (
        <a key={start} href={link} target="_blank" rel="noopener">WhatsApp</a>
      ) : (
        <Link key={start} href={link} onClick={onNavigate}>{link}</Link>
      ),
    );
    last = start + link.length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [emotion, setEmotion] = useState<Emotion>("feliz");
  const [pulse, setPulse] = useState(0);
  const [teaser, setTeaser] = useState(true);
  const [compact, setCompact] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const feel = useCallback((e: Emotion) => {
    setEmotion(e);
    setPulse((p) => p + 1);
  }, []);

  // Mostrar ambos textos desde la entrada, durante cinco segundos.
  useEffect(() => {
    const hide = window.setTimeout(() => {
      setTeaser(false);
      setCompact(true);
    }, 5000);
    return () => window.clearTimeout(hide);
  }, []);

  const toggle = useCallback((next: boolean) => {
    setCompact(true);
    setOpen(next);
    setTeaser(false);
    if (next) {
      setMsgs((m) => (m.length ? m : [HELLO]));
      feel(msgs.length ? emotion : "emocionado");
    }
  }, [emotion, feel, msgs.length]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    document.body.classList.add("tp-chat-open");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("tp-chat-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const b = bodyRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [msgs, busy]);

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 1500);
    if (!text || busy) return;
    const history = [...msgs, { role: "user" as const, content: text }];
    setMsgs(history);
    setBusy(true);
    feel("pensando");
    try {
      const r = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.filter((m) => m !== HELLO).slice(-12).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = r.ok ? await r.json() : {};
      const reply: string = data.reply || (r.status === 429 ? "¡Uf, voy muy rápido! Dame un minutito para recuperar el aliento 🐾" : ERROR_MSG);
      const e: Emotion = data.emotion || "apenado";
      setMsgs((m) => [...m, { role: "assistant", content: reply, emotion: e }]);
      feel(e);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: ERROR_MSG, emotion: "apenado" }]);
      feel("apenado");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const onlyHello = msgs.length === 1;

  return (
    <>
      {!open && (
        <div className={`tp-chat-launcher${compact ? " tp-chat-launcher--compact" : ""}`}>
          <div className="tp-chat-launcher-row">
          {teaser && (
            <button type="button" className="tp-chat-teaser" onClick={() => toggle(true)}>
              ¿Te ayudo con tu bici? 🐾
            </button>
          )}
          <button
            type="button"
            className="tp-chat-fab"
            onClick={() => toggle(true)}
            aria-label="Abrir chat con Tropi, el asistente de Tropicleta"
            aria-haspopup="dialog"
            aria-expanded={false}
            aria-controls="tp-chat-panel"
          >
            <Image unoptimized className="tp-chat-mascot-icon" src="/brand/mascota-nitida.webp" alt="" width={1024} height={1024} />
          </button>
          </div>
          <div className="tp-chat-launcher-row">
            {teaser && <a className="tp-chat-teaser" href={WA_CONSULTAR} target="_blank" rel="noopener noreferrer">Contáctanos</a>}
            <a className="tp-chat-fab tp-chat-whatsapp" href={WA_CONSULTAR} target="_blank" rel="noopener noreferrer" aria-label="Contactar a Tropicleta por WhatsApp">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.91 11.91 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.94 11.94 0 0 0 5.79 1.48h.01c6.57 0 11.94-5.35 11.95-11.93a11.87 11.87 0 0 0-3.48-8.43ZM12.05 21.83a9.9 9.9 0 0 1-5.04-1.38l-.36-.22-3.71.98.99-3.62-.24-.38a9.86 9.86 0 0 1-1.51-5.28c0-5.47 4.45-9.91 9.92-9.91a9.85 9.85 0 0 1 7.01 2.91 9.85 9.85 0 0 1 2.9 7.01c0 5.47-4.45 9.9-9.96 9.9Zm5.44-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.77-1.65-2.06-.17-.3-.02-.46.13-.61l.45-.52c.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.71.63.72.23 1.37.2 1.89.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" /></svg>
            </a>
          </div>
        </div>
      )}

      {open && (
        <section id="tp-chat-panel" className="tp-chat-panel" role="dialog" aria-label="Chat con Tropi, asistente de Tropicleta">
          <header className="tp-chat-head">
            <TropiMascot emotion={busy ? "pensando" : emotion} pulse={pulse} size={54} />
            <div className="tp-chat-head-text">
              <div className="tp-chat-title">Tropi</div>
              <div className="tp-chat-status" aria-live="polite">
                {busy ? "está pensando…" : `está ${EMOTION_LABEL[emotion]}`} · respuestas con IA
              </div>
            </div>
            <button type="button" className="tp-chat-close" onClick={() => setOpen(false)} aria-label="Cerrar chat">
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="tp-chat-body" ref={bodyRef} role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`tp-chat-msg tp-chat-msg--${m.role === "user" ? "user" : "bot"}`} data-emotion={m.emotion}>
                <RichText text={m.content} onNavigate={() => setOpen(false)} />
              </div>
            ))}
            {busy && (
              <div className="tp-chat-msg tp-chat-msg--bot tp-chat-typing" aria-label="Tropi está escribiendo">
                <span /><span /><span />
              </div>
            )}
            {onlyHello && !busy && (
              <div className="tp-chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <form
            className="tp-chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              const input = inputRef.current;
              if (!input) return;
              send(input.value);
              input.value = "";
            }}
          >
            <input ref={inputRef} type="text" maxLength={1500} autoComplete="off" placeholder="Escribe tu mensaje…" aria-label="Escribe tu mensaje" disabled={busy} />
            <button type="submit" aria-label="Enviar" disabled={busy}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </form>
        </section>
      )}
    </>
  );
}
