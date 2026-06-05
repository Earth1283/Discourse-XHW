import "server-only";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

const POSTER_COOKIE = "xhw_pt";

/** Get the caller's poster token, minting + setting one if absent. */
export async function getOrCreatePosterToken(): Promise<string> {
  const jar = await cookies();
  let t = jar.get(POSTER_COOKIE)?.value;
  if (!t) {
    t = nanoid(24);
    jar.set(POSTER_COOKIE, t, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return t;
}

/** Read-only: returns the poster token if present, else null. */
export async function getPosterToken(): Promise<string | null> {
  return (await cookies()).get(POSTER_COOKIE)?.value ?? null;
}
