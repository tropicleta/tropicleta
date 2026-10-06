/** Configuration checks shared by checkout and the administration panel. Never exposes secrets. */
export function paymentConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === "production";
  const https = /^https:\/\//.test(env.NEXT_PUBLIC_SITE_URL ?? "");
  const webpayLive = env.TBK_ENV === "production" && Boolean(env.TBK_COMMERCE_CODE?.trim() && env.TBK_API_KEY?.trim());
  const mpConfigured = Boolean(env.MP_ACCESS_TOKEN?.trim());
  return {
    webpayAvailable: production ? webpayLive && https : env.TBK_ENV === "production" ? webpayLive : true,
    webpayTest: env.TBK_ENV !== "production",
    mpAvailable: mpConfigured && (!production || (https && Boolean(env.MP_WEBHOOK_SECRET?.trim()))),
    mpTest: env.MP_SANDBOX === "1",
    https,
  };
}
