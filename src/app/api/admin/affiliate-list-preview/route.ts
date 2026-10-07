import { isAdmin } from "@/lib/auth";
import { readPublicAffiliateList } from "@/lib/affiliate-list-reader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
let running = false;
let lastRun = 0;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ message: "Origen no autorizado." }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ message: "Ingresa al administrador para comprobar la lista." }, { status: 401 });
  if (running || Date.now() - lastRun < 60000) return Response.json({ message: "Espera un minuto antes de volver a comprobar." }, { status: 429 });
  running = true;
  lastRun = Date.now();
  try { return Response.json(await readPublicAffiliateList(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "No pudimos leer la lista. Tus recomendaciones se conservan." }, { status: 502 });
  } finally { running = false; }
}
