import "server-only";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { promises as fs } from "fs";
import path from "path";
import { db } from "../client";
import { posts, threads } from "../schema";
import type { Post } from "../schema";
import { config } from "@/lib/config";

export function getPost(id: string): Post | undefined {
  return db.select().from(posts).where(eq(posts.id, id)).get();
}

export type CreateReplyArgs = {
  threadId: string;
  boardId: string;
  body: string;
  name: string | null;
  tripcode: string | null;
  posterToken: string;
  ipHash: string;
  sage: boolean;
  imagePath?: string | null;
  thumbPath?: string | null;
};

export function createReply(args: CreateReplyArgs): Post {
  const now = Date.now();
  const id = nanoid(10);

  return db.transaction((tx) => {
    const post = tx
      .insert(posts)
      .values({
        id,
        threadId: args.threadId,
        boardId: args.boardId,
        isOp: false,
        authorHandle: args.name,
        tripcode: args.tripcode,
        body: args.body,
        imagePath: args.imagePath ?? null,
        thumbPath: args.thumbPath ?? null,
        posterToken: args.posterToken,
        ipHash: args.ipHash,
        createdAt: now,
      })
      .returning()
      .get();

    // Always bump reply count; bump the thread to the top unless saged.
    tx.update(threads)
      .set({
        replyCount: sql`${threads.replyCount} + 1`,
        ...(args.sage ? {} : { bumpedAt: now }),
      })
      .where(eq(threads.id, args.threadId))
      .run();

    return post;
  });
}

/** Whether `token` may self-delete `postId` right now (own + within window + not deleted). */
export function canSelfDelete(postId: string, token: string | null, now: number): boolean {
  if (!token) return false;
  const p = getPost(postId);
  if (!p || p.deletedAt != null) return false;
  if (p.posterToken !== token) return false;
  return now - p.createdAt <= config.selfDeleteWindowMs;
}

export function softDeletePost(postId: string, by: "self" | "admin"): void {
  db.update(posts)
    .set({ deletedAt: Date.now(), deletedBy: by })
    .where(eq(posts.id, postId))
    .run();
}

/** Hard-delete: remove post row + any image files from disk. Admin-only. */
export async function hardDeletePost(postId: string): Promise<void> {
  const post = getPost(postId);
  if (!post) return;

  // Delete image files (best-effort — ignore ENOENT)
  for (const relPath of [post.imagePath, post.thumbPath]) {
    if (!relPath) continue;
    const abs = path.join(config.uploadDir, relPath.replace(/^\/uploads\//, ""));
    await fs.unlink(abs).catch(() => {});
  }

  db.delete(posts).where(eq(posts.id, postId)).run();
}
