import "server-only";
import { desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../client";
import { reports, posts } from "../schema";

export type ReportRow = typeof reports.$inferSelect & {
  postBody: string | null;
  postBoardId: string;
  postThreadId: string;
};

export function createReport(postId: string, reason?: string): void {
  // One unresolved report per post is enough.
  const dup = db
    .select()
    .from(reports)
    .where(eq(reports.postId, postId))
    .get();
  if (dup && !dup.resolvedAt) return;

  db.insert(reports)
    .values({ id: nanoid(10), postId, reason: reason ?? null, createdAt: Date.now() })
    .run();
}

export function listOpenReports(): ReportRow[] {
  return db
    .select({
      id: reports.id,
      postId: reports.postId,
      reason: reports.reason,
      resolvedAt: reports.resolvedAt,
      createdAt: reports.createdAt,
      postBody: posts.body,
      postBoardId: posts.boardId,
      postThreadId: posts.threadId,
    })
    .from(reports)
    .leftJoin(posts, eq(reports.postId, posts.id))
    .where(isNull(reports.resolvedAt))
    .orderBy(desc(reports.createdAt))
    .all() as ReportRow[];
}

export function resolveReport(id: string): void {
  db.update(reports).set({ resolvedAt: Date.now() }).where(eq(reports.id, id)).run();
}
