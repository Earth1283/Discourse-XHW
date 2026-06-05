import "server-only";
import { sqlite } from "../client";

export type SearchResult = {
  postId: string;
  threadId: string;
  boardId: string;
  excerpt: string;
  createdAt: number;
};

export type ThreadSearchResult = {
  id: string;
  boardId: string;
  title: string | null;
  replyCount: number;
  bumpedAt: number;
  isLocked: boolean;
  isArchived: boolean;
};

/** Full-text search over post bodies using FTS5. Returns up to `limit` results. */
export function searchPosts(query: string, boardId?: string, limit = 20): SearchResult[] {
  if (!query.trim()) return [];

  // Sanitize: strip FTS5 operators that could cause parse errors
  const safe = query.replace(/["*^]/g, " ").trim();
  if (!safe) return [];

  const ftsQuery = safe.split(/\s+/).filter(Boolean).map((w) => `"${w}"`).join(" OR ");

  const rows = sqlite
    .prepare(
      `SELECT p.id, p.thread_id, p.board_id,
              snippet(posts_fts, 0, '', '', '…', 20) AS excerpt,
              p.created_at
       FROM posts_fts
       JOIN posts p ON p.rowid = posts_fts.rowid
       WHERE posts_fts MATCH ?
         AND p.deleted_at IS NULL
         ${boardId ? "AND p.board_id = ?" : ""}
       ORDER BY posts_fts.rank
       LIMIT ?`,
    )
    .all(...([ftsQuery, ...(boardId ? [boardId] : []), limit])) as Array<{
      id: string;
      thread_id: string;
      board_id: string;
      excerpt: string;
      created_at: number;
    }>;

  return rows.map((r) => ({
    postId: r.id,
    threadId: r.thread_id,
    boardId: r.board_id,
    excerpt: r.excerpt,
    createdAt: r.created_at,
  }));
}

/** Search threads by title (prefix LIKE) — used in admin thread tab. */
export function searchThreads(query: string, limit = 20): ThreadSearchResult[] {
  if (!query.trim()) return [];
  const like = `%${query.replace(/[%_]/g, "\\$&")}%`;
  return sqlite
    .prepare(
      `SELECT id, board_id, title, reply_count, bumped_at, is_locked, is_archived
       FROM threads
       WHERE (title LIKE ? ESCAPE '\\' OR id = ?)
         AND is_archived = 0
       ORDER BY bumped_at DESC
       LIMIT ?`,
    )
    .all(like, query.trim(), limit) as ThreadSearchResult[];
}
