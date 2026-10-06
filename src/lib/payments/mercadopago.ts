import "server-only";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
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
