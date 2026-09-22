// The @google/genai SDK's ApiError only carries `status` + `message`, where
// `message` is the raw JSON error body (e.g. {"error":{"code":429,...,
// "details":[{"@type":".../RetryInfo","retryDelay":"3s"}]}}). Parsing that
// out lets us honor the server's own cooldown instead of guessing.
export function parseGeminiRetryDelayMs(err: unknown): number | null {
  if (!(err instanceof Error)) return null;
  try {
    const body = JSON.parse(err.message) as {
      error?: { details?: { "@type"?: string; retryDelay?: string }[] };
    };
    const retryInfo = body.error?.details?.find((d) => d["@type"]?.endsWith("RetryInfo"));
    const match = retryInfo?.retryDelay?.match(/^(\d+(?:\.\d+)?)s$/);
    if (!match) return null;
    return Math.ceil(Number(match[1]) * 1000);
  } catch {
    return null;
  }
}
