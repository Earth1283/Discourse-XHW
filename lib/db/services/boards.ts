import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "../client";
import { boards, threads } from "../schema";
import type { Board } from "../schema";
import type { BoardDTO } from "@/lib/types";
import { HttpError } from "@/lib/http";

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

export type CreateBoardArgs = {
  id: string;
  name: string;
  description: string;
  sortOrder?: number;
};

export function createBoard(args: CreateBoardArgs): Board {
  if (getBoard(args.id)) throw new HttpError(409, "BOARD_EXISTS", "Board ID already taken.");
  return db
    .insert(boards)
    .values({
      id: args.id,
      name: args.name,
      description: args.description,
      sortOrder: args.sortOrder ?? 99,
      createdAt: Date.now(),
    })
    .returning()
    .get();
}

export type UpdateBoardArgs = {
  name?: string;
  description?: string;
  sortOrder?: number;
  adminOnlyPost?: boolean;
};

export function updateBoard(id: string, patch: UpdateBoardArgs): void {
  if (!getBoard(id)) throw new HttpError(404, "NO_BOARD", "Board not found.");
  db.update(boards).set(patch).where(eq(boards.id, id)).run();
}

export function deleteBoard(id: string): void {
  const board = getBoard(id);
  if (!board) throw new HttpError(404, "NO_BOARD", "Board not found.");
  const liveCount = db
    .select({ c: count() })
    .from(threads)
    .where(eq(threads.boardId, id))
    .get()?.c ?? 0;
  if (liveCount > 0) {
    throw new HttpError(409, "BOARD_NOT_EMPTY", "Cannot delete a board that has threads.");
  }
  db.delete(boards).where(eq(boards.id, id)).run();
}
