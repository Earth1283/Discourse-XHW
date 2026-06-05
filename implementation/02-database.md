# 02 — Database (Drizzle + SQLite)

## 1. `lib/db/schema.ts`

```ts
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),                 // "gen"
  name: text("name").notNull(),                // "General"
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  adminOnlyPost: integer("admin_only_post", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});

export const threads = sqliteTable(
  "threads",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id").notNull().references(() => boards.id),
    title: text("title"),
    bumpedAt: integer("bumped_at").notNull(),
    replyCount: integer("reply_count").notNull().default(0),
    isLocked: integer("is_locked", { mode: "boolean" }).notNull().default(false),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    byBoardBump: index("threads_board_bump").on(t.boardId, t.bumpedAt),
  }),
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id").notNull().references(() => threads.id),
    boardId: text("board_id").notNull(),
    isOp: integer("is_op", { mode: "boolean" }).notNull().default(false),
    authorHandle: text("author_handle"),        // null => Anonymous
    tripcode: text("tripcode"),
    body: text("body").notNull(),
    imagePath: text("image_path"),
    thumbPath: text("thumb_path"),
    posterToken: text("poster_token").notNull(), // for 180-min self delete
    ipHash: text("ip_hash").notNull(),           // never sent to client
    createdAt: integer("created_at").notNull(),
    deletedAt: integer("deleted_at"),
    deletedBy: text("deleted_by"),               // "self" | "admin"
  },
  (t) => ({
    byThread: index("posts_thread").on(t.threadId, t.createdAt),
    byToken: index("posts_token").on(t.posterToken),
  }),
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    handle: text("handle").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("user"), // "user" | "admin"
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({ handleUnique: uniqueIndex("users_handle_unique").on(t.handle) }),
);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id),
  reason: text("reason"),
  resolvedAt: integer("resolved_at"),
  createdAt: integer("created_at").notNull(),
});

export const bans = sqliteTable("bans", {
  ipHash: text("ip_hash").primaryKey(),
  reason: text("reason"),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at"),             // null => permanent
});

// FTS5 virtual table is created in a raw migration (see §4).
```

## 2. `lib/db/client.ts`

```ts
import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { config } from "@/lib/config";
import * as schema from "./schema";

const sqlite = new Database(config.databaseUrl);
sqlite.pragma("journal_mode = WAL");   // better concurrency
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
export { schema };
```

## 3. `drizzle.config.ts`

```ts
import type { Config } from "drizzle-kit";
export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "sqlite",
  dbCredentials: { url: process.env.DATABASE_URL ?? "./data/xhw.db" },
} satisfies Config;
```

Generate + apply:
```bash
mkdir -p data
npm run db:generate
npm run db:migrate
```

`lib/db/migrate.ts`:
```ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { config } from "../config";

const sqlite = new Database(config.databaseUrl);
migrate(drizzle(sqlite), { migrationsFolder: "./lib/db/migrations" });
console.log("migrations applied");
```

## 4. Full-text search (FTS5)

Add a hand-written migration after the generated ones:

```sql
-- lib/db/migrations/9999_fts.sql  (apply via better-sqlite3 .exec)
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  body, content='posts', content_rowid='rowid'
);
CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, body) VALUES (new.rowid, new.body);
END;
CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, body) VALUES('delete', old.rowid, old.body);
END;
CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, body) VALUES('delete', old.rowid, old.body);
  INSERT INTO posts_fts(rowid, body) VALUES (new.rowid, new.body);
END;
```

## 5. Seeding — `lib/db/seed.ts`

```ts
import { db, schema } from "./client";
import { config } from "../config";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

const now = Date.now();

const seedBoards = [
  { id: "gen", name: "General", description: "Anything goes (mostly).", sortOrder: 0, adminOnlyPost: false },
  { id: "rant", name: "Rants", description: "Get it off your chest.", sortOrder: 1, adminOnlyPost: false },
  { id: "hw", name: "Homework", description: "Classes, assignments, suffering.", sortOrder: 2, adminOnlyPost: false },
  { id: "ann", name: "Announcements", description: "Official posts only.", sortOrder: 3, adminOnlyPost: true },
  { id: "random", name: "Random", description: "Chaos.", sortOrder: 4, adminOnlyPost: false },
];

async function main() {
  for (const b of seedBoards) {
    await db.insert(schema.boards).values({ ...b, createdAt: now }).onConflictDoNothing();
  }
  // master admin
  const existing = db.select().from(schema.users).where(eq(schema.users.handle, config.admin.handle)).get();
  if (!existing) {
    await db.insert(schema.users).values({
      id: nanoid(10),
      handle: config.admin.handle,
      passwordHash: await bcrypt.hash(config.admin.password, 12),
      role: "admin",
      createdAt: now,
    });
    console.log("seeded admin:", config.admin.handle);
  }
  console.log("seed complete");
}
main();
```

Run: `npm run db:seed`

## Service layer pattern

Keep all queries in `lib/db/services/*.ts` (e.g. `threads.ts`, `posts.ts`). Route Handlers and tests call services; nothing else touches `db` directly. Example signatures you'll implement:

```ts
// lib/db/services/threads.ts
listThreads(boardId: string, page: number): ThreadCard[]
getThreadWithPosts(threadId: string): { thread, posts } | null
createThread(input): { thread, op }      // also enforces MAX_LIVE_THREADS prune
// lib/db/services/posts.ts
createReply(threadId, input): Post        // bumps thread unless sage
softDeletePost(postId, by): void
canSelfDelete(postId, token, now): boolean
```

## Exit criteria
- Migrations + FTS apply cleanly to a fresh `data/xhw.db`.
- `npm run db:seed` creates 5 boards + the admin user, idempotently.
