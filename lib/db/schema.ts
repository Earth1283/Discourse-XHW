import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(), // e.g. "gen"
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  adminOnlyPost: integer("admin_only_post", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});

export const threads = sqliteTable(
  "threads",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id),
    title: text("title"),
    bumpedAt: integer("bumped_at").notNull(),
    replyCount: integer("reply_count").notNull().default(0),
    isLocked: integer("is_locked", { mode: "boolean" }).notNull().default(false),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("threads_board_bump").on(t.boardId, t.bumpedAt)],
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id),
    boardId: text("board_id").notNull(),
    isOp: integer("is_op", { mode: "boolean" }).notNull().default(false),
    authorHandle: text("author_handle"), // null => Anonymous
    tripcode: text("tripcode"),
    body: text("body").notNull(),
    imagePath: text("image_path"),
    thumbPath: text("thumb_path"),
    posterToken: text("poster_token").notNull(), // for 180-min self delete
    ipHash: text("ip_hash").notNull(), // never sent to client
    createdAt: integer("created_at").notNull(),
    deletedAt: integer("deleted_at"),
    deletedBy: text("deleted_by"), // "self" | "admin"
  },
  (t) => [index("posts_thread").on(t.threadId, t.createdAt), index("posts_token").on(t.posterToken)],
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
  (t) => [uniqueIndex("users_handle_unique").on(t.handle)],
);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id),
  reason: text("reason"),
  resolvedAt: integer("resolved_at"),
  createdAt: integer("created_at").notNull(),
});

export const bans = sqliteTable("bans", {
  ipHash: text("ip_hash").primaryKey(),
  reason: text("reason"),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at"), // null => permanent
});

export type Board = typeof boards.$inferSelect;
export type Thread = typeof threads.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type User = typeof users.$inferSelect;
