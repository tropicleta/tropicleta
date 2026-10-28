"use client";

import { useEffect, useState } from "react";
import { WA_CONSULTAR } from "@/lib/whatsapp";
import styles from "./WhatsAppButton.module.css";

export function WhatsAppButton() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setCompact(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className={`tp-chat-launcher ${compact ? "tp-chat-launcher--compact" : styles.expanded}`}>
      <div className="tp-chat-launcher-row">
      {!compact && <a className={`tp-chat-teaser ${styles.teaser}`} href={WA_CONSULTAR} target="_blank" rel="noopener noreferrer">Contáctanos</a>}
      <a className="tp-chat-fab tp-chat-whatsapp" href={WA_CONSULTAR} target="_blank" rel="noopener noreferrer" aria-label="Contactar a Tropicleta por WhatsApp">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.91 11.91 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.94 11.94 0 0 0 5.79 1.48h.01c6.57 0 11.94-5.35 11.95-11.93a11.87 11.87 0 0 0-3.48-8.43ZM12.05 21.83a9.9 9.9 0 0 1-5.04-1.38l-.36-.22-3.71.98.99-3.62-.24-.38a9.86 9.86 0 0 1-1.51-5.28c0-5.47 4.45-9.91 9.92-9.91a9.85 9.85 0 0 1 7.01 2.91 9.85 9.85 0 0 1 2.9 7.01c0 5.47-4.45 9.9-9.96 9.9Zm5.44-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.77-1.65-2.06-.17-.3-.02-.46.13-.61l.45-.52c.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.71.63.72.23 1.37.2 1.89.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" /></svg>
      </a>
      </div>
    </div>
  );
}
