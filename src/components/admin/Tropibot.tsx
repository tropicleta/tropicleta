"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTropibotRecord } from "@/actions/tropibot";
import { origins, type TropibotRecord } from "@/lib/tropibot-validation";
import { localDate, methods } from "@/lib/accounting-validation";

export function Tropibot({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<TropibotRecord | null>(null);
  const [requestId, setRequestId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  function reset() { setMessages([]); setDraft(null); setRequestId(""); setText(""); setNotice(""); }
  async function send(e: React.FormEvent) {
    e.preventDefault(); if (busy || !text.trim()) return;
    const next = [...messages, { role: "user" as const, content: text.trim() }];
    setBusy(true); setNotice(""); setDraft(null);
    try {
      const response = await fetch("/api/admin/tropibot/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setMessages([...next, { role: "assistant", content: result.reply }]); setText("");
      setDraft(result.draft); if (!requestId) setRequestId(crypto.randomUUID());
    } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo conectar."); }
    finally { setBusy(false); }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const result = await saveTropibotRecord({ ...Object.fromEntries(fd), requestId, amount: Number(fd.get("amount")), paid: fd.get("paid") === "on" });
      setNotice(result.message);
      if (result.ok) { setDraft(null); setMessages([]); setRequestId(""); router.refresh(); }
    } catch { setNotice("No se pudo guardar. Reintenta con el mismo registro."); }
    finally { setBusy(false); }
  }
  return <section className="tp-panel">
    <h2>Cuéntame qué hiciste</h2>
    <p>Por ejemplo: “Hoy hice una mantención a Carlos, llegó por Instagram, fueron $40.000 y ya pagó todo por transferencia”.</p>
    {!enabled && <p role="status">La IA aún no está configurada. Puedes registrar los datos con el formulario manual.</p>}
    <div aria-live="polite">{messages.map((m, i) => <p key={i} style={{whiteSpace:"pre-wrap", padding:12, borderLeft:`3px solid ${m.role === "user" ? "#fb923c" : "#4ade80"}`}}><strong>{m.role === "user" ? "Tú" : "Tropibot"}: </strong>{m.content}</p>)}</div>
    <form onSubmit={send}><label>Tu mensaje<textarea className="tp-input" value={text} onChange={e => setText(e.target.value)} maxLength={2000} rows={3} disabled={busy || !enabled} required /></label><button className="tp-btn tp-btn-primary" disabled={busy || !enabled}>{busy ? "Procesando…" : "Enviar"}</button></form>
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:16}}><button className="tp-btn tp-btn-secondary" disabled={busy} onClick={reset}>Nuevo registro</button><button className="tp-btn tp-btn-secondary" disabled={busy} onClick={() => { setRequestId(crypto.randomUUID()); setDraft({kind:"servicio", date:localDate(), customer:"", description:"", amount:0, paid:false, method:"Otro", origin:"Sin identificar", originDetail:""}); }}>Completar manualmente</button></div>
    <p role="status">{notice}</p>
    {draft && <form onSubmit={save} key={requestId + JSON.stringify(draft)}>
      <h3>Revisa antes de guardar</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
        <label>Tipo<select name="kind" className="tp-input" defaultValue={draft.kind}><option value="servicio">Servicio realizado</option><option value="venta">Venta presencial</option><option value="gasto">Gasto</option></select></label>
        <label>Fecha del registro<input className="tp-input" name="date" type="date" max={localDate()} defaultValue={draft.date} required /></label>
        <label>Cliente / proveedor<input className="tp-input" name="customer" maxLength={120} defaultValue={draft.customer} /></label>
        <label>Descripción<input className="tp-input" name="description" minLength={3} maxLength={500} defaultValue={draft.description} required /></label>
        <label>Monto total CLP<input className="tp-input" name="amount" type="number" min={1} max={2000000000} step={1} defaultValue={draft.amount || ""} required /></label>
        <label>Medio de pago<select className="tp-input" name="method" defaultValue={draft.method}>{methods.map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Cómo llegó el cliente<select className="tp-input" name="origin" defaultValue={draft.origin}>{origins.map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Quién lo recomendó / detalle del origen<input className="tp-input" name="originDetail" maxLength={120} defaultValue={draft.originDetail} /></label>
      </div>
      <p><label><input type="checkbox" name="paid" defaultChecked={draft.paid} /> Pago total recibido / gasto pagado en esta fecha</label></p>
      <p className="tp-hint">Sin marcar: se guarda como pendiente, sin movimiento de caja. Las ventas no descuentan stock. No vuelvas a registrar pedidos online o cobros que ya aparecen en Contabilidad.</p>
      <button className="tp-btn tp-btn-primary" disabled={busy}>Confirmar y guardar</button>
    </form>}
  </section>;
}
