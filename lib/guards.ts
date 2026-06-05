import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { bans } from "./db/schema";
import { HttpError } from "./http";

/** Throw 403 if this ipHash is currently banned. */
export function assertNotBanned(ipHash: string): void {
  const ban = db.select().from(bans).where(eq(bans.ipHash, ipHash)).get();
  if (!ban) return;
  if (ban.expiresAt == null || ban.expiresAt > Date.now()) {
    throw new HttpError(403, "BANNED", "You are banned.");
  }
}

/** Defense-in-depth CSRF guard for state-changing requests. */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return; // same-origin navigations may omit Origin
  const host = req.headers.get("host");
  try {
    if (new URL(origin).host !== host) {
      throw new HttpError(403, "BAD_ORIGIN", "Cross-origin request blocked.");
    }
  } catch {
    throw new HttpError(403, "BAD_ORIGIN", "Bad origin.");
  }
}
