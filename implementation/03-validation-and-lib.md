# 03 — Shared Validation & Core Lib

These are the cross-cutting helpers every route + UI shares.

## 1. zod schemas — `lib/validation/schemas.ts`

```ts
import { z } from "zod";

export const BodySchema = z
  .string()
  .trim()
  .min(1, "Say something.")
  .max(8000, "Too long.");

export const TitleSchema = z.string().trim().max(120).optional();

// "name#secret" -> name + tripcode; bare name allowed; blank => Anonymous
export const NameFieldSchema = z.string().trim().max(50).optional();

export const CreateThreadSchema = z.object({
  title: TitleSchema,
  body: BodySchema,
  name: NameFieldSchema,
  sage: z.boolean().optional().default(false),
  // image handled separately as multipart; this is the JSON path
});

export const CreateReplySchema = z.object({
  body: BodySchema,
  name: NameFieldSchema,
  sage: z.boolean().optional().default(false),
});

export const ReportSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export const HandleAuthSchema = z.object({
  handle: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscore."),
  password: z.string().min(8).max(200),
});

export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;
export type CreateReplyInput = z.infer<typeof CreateReplySchema>;
```

Use the **same file** on client (form validation) and server (route parse). Never trust client validation alone.

## 2. Cookies & poster token — `lib/auth/tokens.ts`

```ts
import "server-only";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

const POSTER_COOKIE = "ssbs_pt";
const RULES_COOKIE = "ssbs_rules_accepted";

export async function getOrCreatePosterToken(): Promise<string> {
  const jar = await cookies();
  let t = jar.get(POSTER_COOKIE)?.value;
  if (!t) {
    t = nanoid(24);
    jar.set(POSTER_COOKIE, t, {
      httpOnly: true, sameSite: "lax", secure: true,
      maxAge: 60 * 60 * 24 * 365, path: "/",
    });
  }
  return t;
}

export async function getPosterToken(): Promise<string | null> {
  return (await cookies()).get(POSTER_COOKIE)?.value ?? null;
}

export async function hasAcceptedRules(): Promise<boolean> {
  return (await cookies()).get(RULES_COOKIE)?.value === "1";
}
```

> The rules cookie is **set client-side** when the user clicks "I Agree" (it's not httpOnly — it's a non-sensitive UI flag). See `10-moderation-safety.md`.

## 3. IP hashing — `lib/auth/iphash.ts`

```ts
import "server-only";
import { createHmac } from "crypto";
import { config } from "@/lib/config";

/** Salted HMAC of the client IP. Never reversible to a raw IP without the salt. */
export function hashIp(ip: string): string {
  return createHmac("sha256", config.ipHashSalt).update(ip).digest("hex");
}

/** Pull the best-effort client IP from request headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}
```

## 4. Tripcodes — `lib/auth/tripcode.ts`

```ts
import "server-only";
import { createHash } from "crypto";
import { config } from "@/lib/config";

/** Parse a name field "Coolguy#secret" into display name + optional tripcode. */
export function parseName(raw?: string): { name: string | null; tripcode: string | null } {
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
```

## 5. Sessions (handles + admin) — `lib/auth/session.ts`

```ts
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { config } from "@/lib/config";

const SESSION_COOKIE = "ssbs_session";
const secret = new TextEncoder().encode(config.sessionSecret);

export type Session = { userId: string; handle: string; role: "user" | "admin" };

export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "admin") throw new HttpError(403, "FORBIDDEN", "Admin only.");
  return s;
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
```

## 6. Rate limiter — `lib/ratelimit/index.ts`

In-process token bucket keyed by `ipHash:action`. Fine for single-instance SQLite deployment; swap for Redis if you scale horizontally.

```ts
import "server-only";

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

/** Returns true if allowed, false if rate-limited. */
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

// periodic cleanup of idle buckets
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [k, v] of buckets) if (v.updatedAt < cutoff) buckets.delete(k);
}, 10 * 60 * 1000).unref?.();
```

## 7. Errors — `lib/http.ts`

```ts
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) {
    return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  }
  console.error(e);
  return Response.json({ error: { code: "INTERNAL", message: "Something broke." } }, { status: 500 });
}
```

## 8. Post body rendering — `lib/format/render.ts`

Render-safe transformation done **at display time** (store raw body). Returns structured tokens the React component maps to elements — avoids `dangerouslySetInnerHTML`.

```ts
export type Segment =
  | { t: "text"; v: string }
  | { t: "greentext"; v: string }
  | { t: "quote"; postId: string }     // >>abc123
  | { t: "link"; v: string }
  | { t: "spoiler"; v: string };

export function renderBody(body: string): Segment[][] {
  return body.split("\n").map((line) => {
    if (line.startsWith(">") && !line.startsWith(">>")) {
      return [{ t: "greentext", v: line }];
    }
    return tokenizeInline(line);
  });
}
// tokenizeInline handles >>id quote-links, URLs, [s]...[/s] spoilers.
```
(Full tokenizer in code; the contract is: **never inject HTML strings**, always emit typed segments rendered by JSX.)

## Exit criteria
- Schemas importable from both client and server with no `server-only` leakage (keep `schemas.ts` free of `server-only`).
- `hashIp`, `parseName`, `rateLimit` have unit tests.
