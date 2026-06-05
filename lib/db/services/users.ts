import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../client";
import { users } from "../schema";
import type { User } from "../schema";
import { HttpError } from "@/lib/http";

const RESERVED = new Set(["admin", "mod", "moderator", "anonymous", "system", "xhw"]);

export function getUser(handle: string): User | undefined {
  return db.select().from(users).where(eq(users.handle, handle.toLowerCase())).get();
}

export async function claimOrLogin(handle: string, password: string): Promise<User> {
  const h = handle.toLowerCase();
  const existing = getUser(h);
  if (existing) {
    const ok = await bcrypt.compare(password, existing.passwordHash);
    if (!ok) throw new HttpError(401, "BAD_CREDS", "Invalid handle or password.");
    return existing;
  }
  if (RESERVED.has(h)) throw new HttpError(400, "RESERVED", "Handle not available.");
  const hash = await bcrypt.hash(password, 12);
  return db
    .insert(users)
    .values({ id: nanoid(10), handle: h, passwordHash: hash, role: "user", createdAt: Date.now() })
    .returning()
    .get();
}

export async function verifyAdmin(handle: string, password: string): Promise<User> {
  const user = getUser(handle.toLowerCase());
  if (!user || user.role !== "admin") throw new HttpError(401, "BAD_CREDS", "Invalid credentials.");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "BAD_CREDS", "Invalid credentials.");
  return user;
}
