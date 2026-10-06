import "server-only";
import { Environment, IntegrationApiKeys, IntegrationCommerceCodes, Options, WebpayPlus } from "transbank-sdk";
import { paymentConfiguration } from "@/lib/payment-config";

/**
 * Webpay Plus. Sin TBK_ENV=production usa el ambiente de integración con las credenciales
 * públicas de prueba del SDK. Producción requiere código de comercio y API key propios.
 */
export function webpayTransaction() {
  if (!paymentConfiguration().webpayAvailable) throw new Error("Webpay no está configurado para este ambiente");
  if (process.env.TBK_ENV === "production") {
    const code = process.env.TBK_COMMERCE_CODE;
    const key = process.env.TBK_API_KEY;
    if (!code || !key) throw new Error("Faltan TBK_COMMERCE_CODE / TBK_API_KEY");
    return new WebpayPlus.Transaction(new Options(code, key, Environment.Production));
  }
  return new WebpayPlus.Transaction(
    new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration),
  );
}

export type WebpayCommit = {
  vci?: string;
  amount: number;
  status: string; // AUTHORIZED | FAILED ...
  buy_order: string;
  session_id: string;
  card_detail?: { card_number?: string };
  accounting_date?: string;
  transaction_date?: string;
  authorization_code?: string;
  payment_type_code?: string;
  response_code: number;
  installments_number?: number;
};
