import "server-only";
import { MercadoPagoConfig, Payment, Preference, User } from "mercadopago";
import { paymentConfiguration } from "@/lib/payment-config";

export function mpEnabled() {
  return paymentConfiguration().mpAvailable;
}

function client() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN");
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
}

export const mpPreference = () => new Preference(client());
export const mpPayment = () => new Payment(client());

export async function mpPaymentEnvironmentMatches(payment: { live_mode?: boolean; collector_id?: number }) {
  if (process.env.MP_SANDBOX !== "1") return payment.live_mode === true;
  if (payment.live_mode === false) return true;
  if (payment.live_mode !== true || !payment.collector_id) return false;
  // Checkout Pro con cuentas ficticias puede devolver live_mode=true.
  // Solo aceptar esa variante si la API autentica al receptor como test_user.
  const seller = await new User(client()).get();
  return seller.tags?.includes("test_user") === true && seller.id === payment.collector_id;
}
