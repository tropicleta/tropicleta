import { WebhookSignatureValidator } from "mercadopago";
import { NextResponse, type NextRequest } from "next/server";
import { syncMercadoPagoPayment } from "@/lib/orders";
import { readRequestJson } from "@/lib/request-json";

/** Webhook de Mercado Pago (tipo "payment"). Confirma el pago consultando la API, nunca confía en el body. */
export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  let raw: unknown;
  try { raw = await readRequestJson(req, 16 * 1024); }
  catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return NextResponse.json({ ok: false }, { status: 400 });
  const body = raw as { type?: string; data?: { id?: string | number } };
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  // Otros tópicos (merchant_order, etc.) no traen firma: se responden 200 para que MP no reintente.
  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, ignored: true });
  if (!/^\d{1,30}$/.test(dataId)) return NextResponse.json({ ok: false }, { status: 400 });

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    console.error("[mp webhook] falta MP_WEBHOOK_SECRET: notificación rechazada");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers.get("x-signature"),
        xRequestId: req.headers.get("x-request-id"),
        dataId,
        secret,
      });
    } catch (e) {
      console.warn("[mp webhook] firma inválida", e);
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    await syncMercadoPagoPayment(dataId);
  } catch (e) {
    console.error("[mp webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 }); // MP reintenta
  }
  return NextResponse.json({ ok: true });
}
