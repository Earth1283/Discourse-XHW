import "server-only";

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

/** Token-bucket rate limit. Returns true if allowed, false if limited. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const refillPerMs = max / windowMs;
  const b = buckets.get(key) ?? { tokens: max, updatedAt: now };
  b.tokens = Math.min(max, b.tokens + (now - b.updatedAt) * refillPerMs);
  b.updatedAt = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

// Drop idle buckets periodically so the map doesn't grow unbounded.
const cleanup = setInterval(
  () => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [k, v] of buckets) if (v.updatedAt < cutoff) buckets.delete(k);
  },
  10 * 60 * 1000,
);
cleanup.unref?.();
