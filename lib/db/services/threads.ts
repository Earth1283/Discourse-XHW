import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../client";
import { posts, threads } from "../schema";
import type { Post, Thread } from "../schema";
import { config } from "@/lib/config";
import type { ThreadCard, ThreadMeta } from "@/lib/types";

const PER_PAGE = 30;

function excerpt(body: string, max = 280): string {
  const t = body.trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

export function listThreadCards(boardId: string, page = 0): ThreadCard[] {
  const rows = db
    .select()
    .from(threads)
    .where(and(eq(threads.boardId, boardId), eq(threads.isArchived, false)))
    .orderBy(desc(threads.isPinned), desc(threads.bumpedAt))
    .limit(PER_PAGE)
    .offset(page * PER_PAGE)
    .all();

  if (rows.length === 0) return [];

  const ids = rows.map((t) => t.id);
  const ops = db
    .select()
    .from(posts)
    .where(and(inArray(posts.threadId, ids), eq(posts.isOp, true)))
    .all();
  const opMap = new Map(ops.map((p) => [p.threadId, p]));

  return rows.map((t) => {
    const op = opMap.get(t.id);
    return {
      id: t.id,
      boardId: t.boardId,
      title: t.title,
      excerpt: op && !op.deletedAt ? excerpt(op.body) : op?.deletedAt ? "[deleted]" : "",
      thumbPath: op && !op.deletedAt ? op.thumbPath : null,
      replyCount: t.replyCount,
      bumpedAt: t.bumpedAt,
      isPinned: t.isPinned,
      isLocked: t.isLocked,
    };
  });
}

export function getThread(threadId: string): Thread | undefined {
  return db.select().from(threads).where(eq(threads.id, threadId)).get();
}

export function getThreadWithPosts(
  threadId: string,
): { thread: ThreadMeta; posts: Post[] } | null {
  const t = db.select().from(threads).where(eq(threads.id, threadId)).get();
  if (!t || t.isArchived) return null;
  const rows = db
    .select()
    .from(posts)
    .where(eq(posts.threadId, threadId))
    .orderBy(asc(posts.createdAt))
    .all();
  return {
    thread: {
      id: t.id,
      boardId: t.boardId,
      title: t.title,
      isLocked: t.isLocked,
      isPinned: t.isPinned,
      isArchived: t.isArchived,
      createdAt: t.createdAt,
      bumpedAt: t.bumpedAt,
      replyCount: t.replyCount,
    },
    posts: rows,
  };
}

export type CreateThreadArgs = {
  boardId: string;
  title?: string;
  body: string;
  name: string | null;
  tripcode: string | null;
  posterToken: string;
  ipHash: string;
  imagePath?: string | null;
  thumbPath?: string | null;
};

export function createThread(args: CreateThreadArgs): { thread: Thread; op: Post } {
  const now = Date.now();
  const threadId = nanoid(10);
  const opId = nanoid(10);

  const result = db.transaction((tx) => {
    const thread = tx
      .insert(threads)
      .values({
        id: threadId,
        boardId: args.boardId,
        title: args.title ?? null,
        bumpedAt: now,
        replyCount: 0,
        createdAt: now,
      })
      .returning()
      .get();

    const op = tx
      .insert(posts)
      .values({
        id: opId,
        threadId,
        boardId: args.boardId,
        isOp: true,
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

    // Prune: archive oldest-bumped non-pinned threads beyond the live cap.
    const live = tx
      .select({ id: threads.id })
      .from(threads)
      .where(and(eq(threads.boardId, args.boardId), eq(threads.isArchived, false), eq(threads.isPinned, false)))
      .orderBy(desc(threads.bumpedAt))
      .all();
    if (live.length > config.maxLiveThreads) {
      const toArchive = live.slice(config.maxLiveThreads).map((r) => r.id);
      if (toArchive.length > 0) {
        tx.update(threads).set({ isArchived: true }).where(inArray(threads.id, toArchive)).run();
      }
    }

    return { thread, op };
  });

  return result;
}

export type ThreadPatch = {
  isLocked?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
};

export function setThreadMeta(threadId: string, patch: ThreadPatch): void {
  db.update(threads).set(patch).where(eq(threads.id, threadId)).run();
}
