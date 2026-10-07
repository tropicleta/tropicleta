import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/cart/ClearCart";
import { formatCLP } from "@/lib/format";
import { getOrderByCode, syncMercadoPagoPayment } from "@/lib/orders";
import { mpEnabled } from "@/lib/payments/mercadopago";
import { whatsappUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estado de tu compra", robots: { index: false } };

type Props = { searchParams: Promise<{ orden?: string; payment_id?: string }> };

export default async function GraciasCompraPage({ searchParams }: Props) {
  const { orden, payment_id } = await searchParams;
  if (!orden) notFound();

  let data = await getOrderByCode(orden);
  if (!data) notFound();

  // Mercado Pago: si volvemos antes que el webhook, verificamos el pago directamente.
  if (data.order.status === "pendiente" && data.order.paymentMethod === "mercadopago" && payment_id && mpEnabled()) {
    await syncMercadoPagoPayment(payment_id).catch((e) => console.error("[mp retorno]", e));
    data = (await getOrderByCode(orden))!;
  }

  const { order, items } = data;
  const paid = ["pagada", "lista", "entregada"].includes(order.status);
  const pending = order.status === "pendiente";

  return (
    <section className="tp-hero tp-page-hero">
      {paid && <ClearCart />}
      <div className="tp-shell tp-two-col" style={{ position: "relative", zIndex: 1 }}>
        <div>
          <span className="tp-kicker">Orden {order.code}</span>
          {paid ? (
            <>
              <h1 className="tp-display">
                ¡Gracias por <span>tu compra!</span>
              </h1>
              <p className="tp-hero-copy">
                Recibimos tu pago. Puedes revisar el detalle de tu compra en esta página y consultar tu orden con el código {order.code}.{" "}
                {order.deliveryMethod === "retiro"
                  ? "Te avisaremos por WhatsApp cuando tu pedido esté listo para retirar en el taller."
                  : "Te contactaremos por WhatsApp para coordinar el despacho."}
              </p>
            </>
          ) : pending ? (
            <>
              <h1 className="tp-display">
                Pago en <span>proceso.</span>
              </h1>
              <p className="tp-hero-copy">
                Estamos esperando la confirmación del medio de pago. Recarga esta página en unos minutos.
              </p>
            </>
          ) : (
            <>
              <h1 className="tp-display">
                El pago no se <span>completó.</span>
              </h1>
              <p className="tp-hero-copy">
                {order.status === "anulada" ? "Cancelaste el pago o expiró el tiempo." : "El pago fue rechazado."} No
                tenemos un pago confirmado para esta orden. Tus productos siguen en el carrito. Si ves un cargo en tu cuenta, contáctanos antes de volver a pagar.
              </p>
            </>
          )}
          <div className="tp-actions">
            {paid || pending ? (
              <Link className="tp-btn tp-btn-primary" href="/tienda/">
                Seguir comprando
              </Link>
            ) : (
              <Link className="tp-btn tp-btn-primary" href="/checkout/">
                Intentar de nuevo
              </Link>
            )}
            <a
              className="tp-btn tp-btn-secondary"
              href={whatsappUrl(`Hola Tropicleta, tengo una consulta sobre mi orden ${order.code}.`)}
              target="_blank"
              rel="noopener"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>

        <div className="tp-panel tp-stack">
          {items.map((i) => (
            <div key={i.id} className="tp-summary-row">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span>{formatCLP(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
          <div className="tp-summary-row">
            <span>Despacho</span>
            <span>{order.shipping ? formatCLP(order.shipping) : "Gratis"}</span>
          </div>
          <div className="tp-summary-total">
            <span>Total</span>
            <strong>{formatCLP(order.total)}</strong>
          </div>
          <dl className="tp-dl tp-small">
            <div>
              <dt>Entrega</dt>
              <dd>{order.deliveryMethod === "retiro" ? "Retiro en taller" : `${order.address}, ${order.commune}`}</dd>
            </div>
            <div>
              <dt>Medio de pago</dt>
              <dd>{order.paymentMethod === "mercadopago" ? "Mercado Pago" : "Pago con tarjeta"}</dd>
            </div>
            {order.authorizationCode && (
              <div>
                <dt>Código de autorización</dt>
                <dd>{order.authorizationCode}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
