import "server-only";
import { HttpError } from "@/lib/http";
import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const URL_RE = /https?:\/\/[^\s<]+/g;

const MAX_LINKS_NEW_TOKEN = 2;

function countLinks(body: string): number {
  return (body.match(URL_RE) ?? []).length;
}

function isNewToken(token: string): boolean {
  const row = db.select({ id: posts.id }).from(posts).where(eq(posts.posterToken, token)).get();
  return !row;
}

/** New poster tokens (no prior posts) are capped at 2 links — basic spam deterrent. */
export function assertLinkCap(token: string, body: string): void {
  if (countLinks(body) > MAX_LINKS_NEW_TOKEN && isNewToken(token)) {
    throw new HttpError(422, "LINK_CAP", `New accounts may include at most ${MAX_LINKS_NEW_TOKEN} links per post.`);
  }
}
