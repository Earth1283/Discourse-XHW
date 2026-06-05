import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "../client";
import { boards, threads } from "../schema";
import type { Board } from "../schema";
import type { BoardDTO } from "@/lib/types";

export function listBoards(): BoardDTO[] {
  const rows = db.select().from(boards).orderBy(asc(boards.sortOrder)).all();
  const counts = db
    .select({ boardId: threads.boardId, c: count() })
    .from(threads)
    .where(eq(threads.isArchived, false))
    .groupBy(threads.boardId)
    .all();
  const countMap = new Map(counts.map((r) => [r.boardId, r.c]));
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    sortOrder: b.sortOrder,
    adminOnlyPost: b.adminOnlyPost,
    liveThreads: countMap.get(b.id) ?? 0,
  }));
}

export function getBoard(id: string): Board | undefined {
  return db.select().from(boards).where(eq(boards.id, id)).get();
}
