import type { Metadata } from "next";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { paymentConfiguration } from "@/lib/payment-config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const config = paymentConfiguration();
  return (
    <section className="tp-section" style={{ paddingTop: 48 }}>
      <div className="tp-shell">
        <span className="tp-kicker">Tienda Tropicleta</span>
        <h1 className="tp-display tp-section-title">Finalizar compra</h1>
        <CheckoutForm
          mpAvailable={config.mpAvailable}
          testPayments={config.mpAvailable && config.mpTest}
          notice={error ? "No pudimos procesar el pago. Revisa tus datos e intenta nuevamente." : undefined}
        />
      </div>
    </section>
  );
}
