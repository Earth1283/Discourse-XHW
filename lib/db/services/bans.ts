import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { bans } from "../schema";

export function listBans() {
  return db.select().from(bans).all();
}

export function createBan(ipHash: string, reason?: string, expiresAt?: number): void {
  db.insert(bans)
    .values({ ipHash, reason: reason ?? null, createdAt: Date.now(), expiresAt: expiresAt ?? null })
    .onConflictDoUpdate({
      target: bans.ipHash,
      set: { reason: reason ?? null, expiresAt: expiresAt ?? null, createdAt: Date.now() },
    })
    .run();
}

export function liftBan(ipHash: string): void {
  db.delete(bans).where(eq(bans.ipHash, ipHash)).run();
}
