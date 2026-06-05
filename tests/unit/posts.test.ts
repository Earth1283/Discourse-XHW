import { vi, describe, it, expect, beforeAll, beforeEach } from "vitest";

// Create db BEFORE vi.mock factory runs (vi.hoisted executes first)
const state = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(`
    CREATE TABLE boards (id TEXT PRIMARY KEY, name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0,
      admin_only_post INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
    CREATE TABLE threads (id TEXT PRIMARY KEY, board_id TEXT NOT NULL,
      title TEXT, bumped_at INTEGER NOT NULL, reply_count INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0, is_pinned INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
    CREATE TABLE posts (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL,
      board_id TEXT NOT NULL, is_op INTEGER NOT NULL DEFAULT 0,
      author_handle TEXT, tripcode TEXT, body TEXT NOT NULL,
      image_path TEXT, thumb_path TEXT, poster_token TEXT NOT NULL,
      ip_hash TEXT NOT NULL, created_at INTEGER NOT NULL,
      deleted_at INTEGER, deleted_by TEXT);
  `);
  return { sqlite };
});

vi.mock("@/lib/db/client", async () => {
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const schema = await import("@/lib/db/schema");
  const db = drizzle(state.sqlite, { schema });
  return { db, schema, sqlite: state.sqlite };
});

import { canSelfDelete, softDeletePost } from "@/lib/db/services/posts";

const BOARD_ID = "gen";
const THREAD_ID = "thr1";
const POST_ID = "pst1";
const TOKEN = "tok-test-123";
const WINDOW = 180 * 60 * 1000;

beforeAll(() => {
  state.sqlite.exec(`
    INSERT OR IGNORE INTO boards (id, name, description, created_at)
      VALUES ('${BOARD_ID}', 'General', '', 0);
    INSERT OR IGNORE INTO threads (id, board_id, bumped_at, reply_count,
      is_locked, is_pinned, is_archived, created_at)
      VALUES ('${THREAD_ID}', '${BOARD_ID}', 0, 0, 0, 0, 0, 0);
  `);
});

beforeEach(() => {
  state.sqlite.exec("DELETE FROM posts");
});

function insertPost(overrides: Record<string, unknown> = {}) {
  const r = {
    id: POST_ID,
    thread_id: THREAD_ID,
    board_id: BOARD_ID,
    is_op: 0,
    body: "test",
    poster_token: TOKEN,
    ip_hash: "hash",
    created_at: Date.now(),
    deleted_at: "NULL",
    deleted_by: "NULL",
    ...overrides,
  };
  state.sqlite.exec(`
    INSERT INTO posts (id, thread_id, board_id, is_op, body,
      poster_token, ip_hash, created_at, deleted_at, deleted_by)
    VALUES ('${r.id}', '${r.thread_id}', '${r.board_id}', ${r.is_op}, '${r.body}',
            '${r.poster_token}', '${r.ip_hash}', ${r.created_at},
            ${r.deleted_at}, ${r.deleted_by})
  `);
}

describe("canSelfDelete", () => {
  it("false when token is null", () => {
    insertPost();
    expect(canSelfDelete(POST_ID, null, Date.now())).toBe(false);
  });

  it("false when post not found", () => {
    expect(canSelfDelete("nonexistent", TOKEN, Date.now())).toBe(false);
  });

  it("false when token doesn't match", () => {
    insertPost();
    expect(canSelfDelete(POST_ID, "wrong", Date.now())).toBe(false);
  });

  it("true for own post within window", () => {
    insertPost({ created_at: Date.now() - 60_000 });
    expect(canSelfDelete(POST_ID, TOKEN, Date.now())).toBe(true);
  });

  it("false when window expired", () => {
    insertPost({ created_at: Date.now() - WINDOW - 1_000 });
    expect(canSelfDelete(POST_ID, TOKEN, Date.now())).toBe(false);
  });

  it("false for already-deleted post", () => {
    insertPost({ deleted_at: Date.now() - 1_000 });
    expect(canSelfDelete(POST_ID, TOKEN, Date.now())).toBe(false);
  });
});

describe("softDeletePost", () => {
  it("sets deletedAt and deletedBy", () => {
    insertPost();
    softDeletePost(POST_ID, "self");
    const row = state.sqlite
      .prepare("SELECT deleted_at, deleted_by FROM posts WHERE id = ?")
      .get(POST_ID) as { deleted_at: number; deleted_by: string };
    expect(row.deleted_at).not.toBeNull();
    expect(row.deleted_by).toBe("self");
  });
});
