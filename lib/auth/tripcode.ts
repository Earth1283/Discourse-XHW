import "server-only";
import { createHash } from "crypto";
import { config } from "@/lib/config";

/** Parse a name field "Coolguy#secret" into display name + optional tripcode. */
export function parseName(raw?: string | null): { name: string | null; tripcode: string | null } {
  if (!raw) return { name: null, tripcode: null };
  const hashIdx = raw.indexOf("#");
  if (hashIdx === -1) return { name: raw || null, tripcode: null };
  const name = raw.slice(0, hashIdx) || null;
  const secret = raw.slice(hashIdx + 1);
  if (!secret) return { name, tripcode: null };
  const trip = createHash("sha256")
    .update(secret + config.tripcodeSalt)
    .digest("base64")
    .slice(0, 10);
  return { name, tripcode: `!${trip}` };
}
