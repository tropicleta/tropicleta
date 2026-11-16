import { createHmac } from 'node:crypto';
import { createRankingService } from '../../../../game/tropi/service.mjs';
import { rankingStore } from '@/lib/tropi-ranking-store';

export const runtime = 'nodejs';
const LIMIT = 262144;
const headers = { 'Cache-Control': 'no-store' };
const reply = (status: number, data: unknown) => Response.json(data, { status, headers });
function service() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('Ranking no configurado.');
  // Separate the game's signing key from login sessions without another credential.
  return createRankingService({ secret: createHmac('sha256', secret).update('tropicleta:ranking:v1').digest('hex'), store: rankingStore });
}
export async function GET() {
  try {
    return Response.json(await service().list(), { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' } });
  } catch { return reply(503, { error: 'No se pudo consultar el ranking. Intenta otra vez.' }); }
}
export async function POST(request: Request) {
  const allowed = ['https://www.tropicleta.com', 'https://tropicleta.com'];
  if (process.env.NODE_ENV !== 'production') allowed.push(new URL(request.url).origin);
  if (!allowed.includes(request.headers.get('origin') ?? '')) return reply(403, { error: 'Origen no permitido.' });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415, { error: 'Envía los datos como JSON.' });
  if (Number(request.headers.get('content-length')) > LIMIT) return reply(413, { error: 'Recorrido demasiado grande.' });
  let body;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { error: 'Datos inválidos.' });
    let size = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > LIMIT) { await reader.cancel(); return reply(413, { error: 'Recorrido demasiado grande.' }); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return reply(400, { error: 'Datos inválidos.' }); }
  let api;
  try { api = service(); } catch { return reply(503, { error: 'El ranking no está disponible. Intenta otra vez.' }); }
  try {
    if (body?.action === 'start') return reply(200, api.start());
    if (body?.action === 'stage') return reply(200, api.advance(body.token, body.proof));
    if (body?.action === 'submit') return reply(200, await api.submit(body.token, body.name));
    return reply(400, { error: 'Acción inválida.' });
  } catch (error) {
    // Validation errors are safe; database/internal errors must never reach the browser.
    const message = error instanceof Error ? error.message : '';
    if (/^(Partida|Esta partida|El recorrido|Recorrido|Controles|Falta el|Acciones|La etapa|Completa las|Escribe un|Usa entre)/.test(message)) return reply(400, { error: message });
    return reply(503, { error: 'No se pudo guardar el puntaje. Intenta otra vez.' });
  }
}
