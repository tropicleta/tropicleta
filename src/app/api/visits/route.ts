import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { readRequestJson } from "@/lib/request-json";
import { allowPublicSubmission } from "@/lib/public-limit";
import { visitSource } from "@/lib/visit-source";

const input = z.object({
  path: z.string().max(200).regex(/^\/(?!\/)[a-zA-Z0-9/_.%~-]*$/),
  first: z.boolean(), referrer: z.string().max(2048), source: z.string().max(200), campaign: z.string().max(200),
});

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return new Response(null, { status: 403 });
  if (/bot|crawler|spider|headless/i.test(request.headers.get("user-agent") || "")) return new Response(null, { status: 204 });
  try {
    const parsed = input.safeParse(await readRequestJson(request, 4096));
    if (!parsed.success) return new Response(null, { status: 400 });
    const data = parsed.data;
    if (/^\/(admin|api)(\/|$)/.test(data.path)) return new Response(null, { status: 400 });
    if (!await allowPublicSubmission("visits", 120, 15)) return new Response(null, { status: 429 });
    const { source, campaign } = visitSource(data.referrer, data.source, data.campaign, origin);
    await db.execute(sql`insert into visit_daily (path, source, campaign, views, visits)
      values (${data.path}, ${source}, ${campaign}, 1, ${data.first ? 1 : 0})
      on conflict (day, path, source, campaign) do update set
      views = visit_daily.views + 1, visits = visit_daily.visits + excluded.visits`);
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
