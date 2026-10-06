"use client";

import Link from "next/link";
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
const TEASER_KEY = "tp-tropi-teaser";

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
  const [teaser, setTeaser] = useState(false);
  const [compact, setCompact] = useState(false);
  const dismissed = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const feel = useCallback((e: Emotion) => {
    setEmotion(e);
    setPulse((p) => p + 1);
  }, []);

  // Saludo breve una vez por sesión; después quedan solo los accesos compactos.
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(TEASER_KEY) === "1"; } catch {}
    if (seen) { setCompact(true); return; }
    const show = window.setTimeout(() => {
      if (!dismissed.current) setTeaser(true);
    }, 8000);
    const hide = window.setTimeout(() => {
      setTeaser(false);
      setCompact(true);
      try { sessionStorage.setItem(TEASER_KEY, "1"); } catch {}
    }, 12000);
    return () => { window.clearTimeout(show); window.clearTimeout(hide); };
  }, []);

  const toggle = useCallback((next: boolean) => {
    dismissed.current = true;
    setCompact(true);
    setOpen(next);
    setTeaser(false);
    try { sessionStorage.setItem(TEASER_KEY, "1"); } catch {}
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
            <TropiMascot emotion={teaser ? "emocionado" : "feliz"} pulse={teaser ? 1 : 0} size={46} reaction={false} />
          </button>
          </div>
          <div className="tp-chat-launcher-row">
            {teaser && <a className="tp-chat-teaser" href={WA_CONSULTAR} target="_blank" rel="noopener noreferrer">Contáctanos</a>}
            <a className="tp-chat-fab tp-chat-whatsapp" href={WA_CONSULTAR} target="_blank" rel="noopener noreferrer" aria-label="Contactar a Tropicleta por WhatsApp">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 11.5a9 9 0 0 1-13.5 8L3 21l1.5-4.5A9 9 0 1 1 21 11.5Z" />
                <path d="m8 7 2 3-1 1c1 2 2 3 4 4l1-1 3 2c-1 2-3 2-5 1-3-1-5-3-6-6-1-2-1-4 1-5Z" />
              </svg>
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
          <a className="tp-chat-wa" href={WA_CONSULTAR} target="_blank" rel="noopener">¿Prefieres hablar con una persona? Escríbenos por WhatsApp</a>
        </section>
      )}
    </>
  );
}
