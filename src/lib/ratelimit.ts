import "server-only";

/**
 * Simple in-memory sliding-window limiter (per server instance). Good enough for a small private app;
 * Supabase also rate-limits auth endpoints on its side.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) return false;
  arr.push(now);
  hits.set(key, arr);
  return true;
}
