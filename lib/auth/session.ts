import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { HttpError } from "@/lib/http";

const SESSION_COOKIE = "xhw_session";
const secret = new TextEncoder().encode(config.sessionSecret);

export type Session = { userId: string; handle: string; role: "user" | "admin" };

export async function createSession(s: Session): Promise<void> {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: String(payload.userId), handle: String(payload.handle), role: payload.role as Session["role"] };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "admin") throw new HttpError(403, "FORBIDDEN", "Admin only.");
  return s;
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
