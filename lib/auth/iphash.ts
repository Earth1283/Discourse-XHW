import "server-only";
import { createHmac } from "crypto";
import { config } from "@/lib/config";

/** Salted HMAC of the client IP. Not reversible to a raw IP without the salt. */
export function hashIp(ip: string): string {
  return createHmac("sha256", config.ipHashSalt).update(ip).digest("hex");
}

/** Best-effort client IP from proxy headers. Trust only behind a known proxy. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}
