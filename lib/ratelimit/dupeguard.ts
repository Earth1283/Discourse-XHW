import "server-only";
import { HttpError } from "@/lib/http";

type Entry = { body: string; ts: number };
const last = new Map<string, Entry>();

// Cleanup idle entries every 10 min
const cleanup = setInterval(
  () => {
    const cutoff = Date.now() - 5 * 60_000;
    for (const [k, v] of last) if (v.ts < cutoff) last.delete(k);
  },
  10 * 60_000,
);
cleanup.unref?.();

/** Throw 429 if `token` posted identical `body` within `windowMs`. Updates record on pass. */
export function assertNotDupe(token: string, body: string, windowMs = 30_000): void {
  const now = Date.now();
  const prev = last.get(token);
  if (prev && prev.body === body && now - prev.ts < windowMs) {
    throw new HttpError(429, "DUPLICATE_POST", "Duplicate post — slow down.");
  }
  last.set(token, { body, ts: now });
}
