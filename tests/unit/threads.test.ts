import { vi, describe, it, expect, beforeEach } from "vitest";

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

import { createThread } from "@/lib/db/services/threads";

const BOARD = "prune";
// MAX_LIVE_THREADS_PER_BOARD = 3 (process.env set in tests/setup.ts)
const MAX = 3;

function seedBoard() {
  state.sqlite.exec(
    `INSERT OR IGNORE INTO boards (id, name, description, created_at)
     VALUES ('${BOARD}', 'Prune', '', 0)`
  );
}

function addThread(pinned = false) {
  const t = createThread({
    boardId: BOARD,
    body: "content",
    name: null,
    tripcode: null,
    posterToken: "tok",
    ipHash: "hash",
  });
  if (pinned) {
    state.sqlite.exec(
      `UPDATE threads SET is_pinned = 1 WHERE id = '${t.thread.id}'`
    );
  }
  return t;
}

beforeEach(() => {
  state.sqlite.exec("DELETE FROM posts; DELETE FROM threads;");
  seedBoard();
});

describe("createThread prune", () => {
  it("archives oldest thread when live count exceeds cap", () => {
    for (let i = 0; i < MAX; i++) addThread();

    const liveBefore = (
      state.sqlite
        .prepare(
          `SELECT count(*) as c FROM threads WHERE board_id='${BOARD}' AND is_archived=0`
        )
        .get() as { c: number }
    ).c;
    expect(liveBefore).toBe(MAX);

    addThread(); // triggers prune

    const liveAfter = (
      state.sqlite
        .prepare(
          `SELECT count(*) as c FROM threads WHERE board_id='${BOARD}' AND is_archived=0`
        )
        .get() as { c: number }
    ).c;
    const archived = (
      state.sqlite
        .prepare(
          `SELECT count(*) as c FROM threads WHERE board_id='${BOARD}' AND is_archived=1`
        )
        .get() as { c: number }
    ).c;

    expect(liveAfter).toBe(MAX);
    expect(archived).toBe(1);
  });

  it("pinned thread is never pruned", () => {
    addThread(true); // pinned

    // Fill up and overflow
    for (let i = 0; i < MAX + 1; i++) addThread(false);

    const pinned = state.sqlite
      .prepare(
        `SELECT is_archived FROM threads WHERE board_id='${BOARD}' AND is_pinned=1`
      )
      .all() as { is_archived: number }[];

    expect(pinned.length).toBeGreaterThan(0);
    for (const row of pinned) {
      expect(row.is_archived).toBe(0);
    }
  });
});
