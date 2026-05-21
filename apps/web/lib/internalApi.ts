export function internalApiHeaders(): Record<string, string> {
  const key = process.env.B2S_INTERNAL_API_KEY;
  return key ? { "x-b2s-internal-key": key } : {};
}
