/** Store only public attribution labels, never referrer URLs or query strings. */
export function visitSource(referrer: string, source: string, campaign: string, origin: string) {
  const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9áéíóúñ _.-]/g, "").trim().slice(0, 80);
  let host = "";
  try { const url = new URL(referrer); if (url.origin !== origin) host = url.hostname.replace(/^www\./, ""); } catch {}
  const label = clean(source) || (/(^|\.)google\./.test(host) ? "Google" : /(^|\.)instagram\.com$/.test(host) ? "Instagram" : /(^|\.)facebook\.com$/.test(host) ? "Facebook" : /(^|\.)(whatsapp\.com|wa\.me)$/.test(host) ? "WhatsApp" : host.slice(0, 80)) || "Directo / desconocido";
  return { source: label, campaign: clean(campaign) };
}
