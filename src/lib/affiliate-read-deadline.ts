/** SITE_ID is available in Netlify Functions; NETLIFY alone is build-time only. */
export const isNetlifyRuntime = (env: Record<string, string | undefined> = process.env) => Boolean(env.SITE_ID || env.NETLIFY);

/** Leave time for cleanup and the HTTP error response before Netlify's 60s limit. */
export async function withAffiliateReadDeadline<T>(
  operation: (signal?: AbortSignal) => Promise<T>,
  netlify = isNetlifyRuntime(),
  timeoutMs = 45_000,
): Promise<T> {
  if (!netlify) return operation();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("La lectura superó el tiempo disponible en Netlify. Tus recomendaciones se conservan; puedes agregarlas manualmente o intentar más tarde."));
      controller.abort();
    }, timeoutMs);
  });
  try { return await Promise.race([operation(controller.signal), expired]); }
  finally { clearTimeout(timer); controller.abort(); }
}
