"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { startCheckout, type CheckoutState } from "@/actions/checkout";
import { useCart } from "@/components/cart/CartProvider";
import { Field } from "@/components/Field";
import { SubmitButton } from "@/components/SubmitButton";
import { deliveryCommunes, shopRules } from "@/data/shop";
import { formatCLP } from "@/lib/format";
import { NationalShippingQuote } from "@/components/cart/NationalShippingQuote";

export function CheckoutForm({ mpAvailable, testPayments, notice }: { mpAvailable: boolean; testPayments: boolean; notice?: string }) {
  const { items, subtotal, ready, setQuantity } = useCart();
  const [state, action] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [method, setMethod] = useState<"retiro" | "despacho">(
    state.values?.deliveryMethod === "despacho" ? "despacho" : "retiro",
  );
  const [commune, setCommune] = useState<string>((state.values?.commune as string) ?? "");

  // Redirección a la pasarela
  useEffect(() => {
    if (!state.redirect) return;
    window.location.href = state.redirect.url;
  }, [state.redirect]);

  // Ajusta el carrito si el servidor detectó falta de stock
  useEffect(() => {
    state.stockIssues?.forEach((s) => setQuantity(s.productId, s.available));
  }, [state.stockIssues, setQuantity]);

  const shipping = method === "despacho" ? (shopRules.shippingByCommune[commune as keyof typeof shopRules.shippingByCommune] ?? 0) : 0;
  const err = (k: string) =>
    state.errors?.[k] && (
      <span className="tp-error" role="alert">
        {state.errors[k]}
      </span>
    );

  if (!ready) return <div className="tp-panel tp-empty">Cargando…</div>;
  if (!items.length && !state.redirect) {
    return (
      <div className="tp-panel tp-empty">
        <p style={{ margin: 0 }}>Tu carrito está vacío.</p>
        <Link className="tp-btn tp-btn-primary" href="/tienda/">
          Ver tienda
        </Link>
      </div>
    );
  }

  return (
    <>
      <form action={action} className="tp-two-col" noValidate>
        <div className="tp-panel tp-form">
          {(notice || state.message) && (
            <div className="tp-alert" role="alert">
              {state.message ?? notice}
            </div>
          )}

          <fieldset className="tp-fieldset">
            <legend className="tp-label">1. Tus datos</legend>
            <Field name="name" label="Nombre completo" autoComplete="name" state={state} required />
            <div className="tp-form-grid">
              <Field name="email" label="Email" type="email" autoComplete="email" state={state} required hint="Te enviamos el comprobante" />
              <Field name="phone" label="Celular" type="tel" inputMode="tel" autoComplete="tel" placeholder="9 1234 5678" state={state} required />
            </div>
          </fieldset>

          <fieldset className="tp-fieldset">
            <legend className="tp-label">2. Entrega</legend>
            <div className="tp-options">
              <label className="tp-option">
                <input type="radio" name="deliveryMethod" value="retiro" checked={method === "retiro"} onChange={() => setMethod("retiro")} />
                <span>
                  {shopRules.pickupLabel}
                  <small>Sin costo · te avisamos por WhatsApp cuando esté listo</small>
                </span>
              </label>
              <label className="tp-option">
                <input type="radio" name="deliveryMethod" value="despacho" checked={method === "despacho"} onChange={() => setMethod("despacho")} />
                <span>
                  {shopRules.deliveryLabel}
                  <small>Tierra Amarilla, Paipote y Copiapó</small>
                </span>
              </label>
            </div>
            {err("deliveryMethod")}
            <p className="tp-hint">Para otras comunas de Chile, <a href="#envio-nacional">cotiza el envío nacional</a> antes de pagar. El retiro en taller requiere que tú o una persona autorizada retire el pedido.</p>
            {method === "despacho" && (
              <div className="tp-form-grid">
                <Field
                  name="commune"
                  label="Comuna / sector"
                  as="select"
                  state={state}
                  value={commune}
                  onChange={(e) => setCommune((e.target as HTMLSelectElement).value)}
                  defaultValue={undefined}
                >
                  <option value="" disabled>
                    Elige una opción
                  </option>
                  {deliveryCommunes.map((c) => (
                    <option key={c} value={c}>
                      {c} · {formatCLP(shopRules.shippingByCommune[c])}
                    </option>
                  ))}
                </Field>
                <Field name="address" label="Dirección" autoComplete="street-address" state={state} required />
              </div>
            )}
            <Field name="notes" label="Notas para la entrega" as="textarea" rows={2} state={state} optional />
          </fieldset>

          <fieldset className="tp-fieldset">
            <legend className="tp-label">3. Pago</legend>
            {testPayments && <p className="tp-alert">Hay medios de pago en modo de prueba. Los pagos de prueba no son compras reales.</p>}
            {!mpAvailable && <p className="tp-alert">Estamos habilitando los pagos online. Tu carrito se conserva para cuando estén disponibles.</p>}
            <div className="tp-options">
              <label className="tp-option" style={mpAvailable ? undefined : { opacity: 0.5 }}>
                <input type="radio" name="paymentMethod" value="mercadopago" disabled={!mpAvailable} defaultChecked={mpAvailable} />
                <span>
                  Mercado Pago
                  <small>{mpAvailable ? "Tarjetas y saldo en cuenta" : "Próximamente"}</small>
                </span>
              </label>
            </div>
            {err("paymentMethod")}
          </fieldset>

          <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))} />
          {err("items")}
        </div>

        <aside className="tp-panel tp-stack tp-sticky">
          <span className="tp-kicker" style={{ marginBottom: 0 }}>
            Resumen
          </span>
          {items.map((i) => (
            <div key={i.productId} className="tp-summary-row">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span>{formatCLP(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="tp-summary-row">
            <span>Subtotal</span>
            <span>{formatCLP(subtotal)}</span>
          </div>
          <div className="tp-summary-row">
            <span>Despacho</span>
            <span>{method === "retiro" ? "Gratis" : commune ? formatCLP(shipping) : "—"}</span>
          </div>
          <div className="tp-summary-total">
            <span>Total</span>
            <strong>{formatCLP(subtotal + shipping)}</strong>
          </div>
          {state.redirect ? (
            <button type="button" className="tp-btn tp-btn-primary tp-btn-block" disabled>
              Redirigiendo al pago…
            </button>
          ) : (
            <SubmitButton disabled={!mpAvailable} className="tp-btn tp-btn-primary tp-btn-block" pendingText="Conectando con el pago…">
              Pagar {formatCLP(subtotal + shipping)}
            </SubmitButton>
          )}
          <p className="tp-hint" style={{ margin: 0 }}>
            Pago seguro. El total se verifica nuevamente antes de cobrar.
          </p>
        </aside>
      </form>
      <NationalShippingQuote />
    </>
  );
}
