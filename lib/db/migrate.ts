import "./loadenv";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const url = process.env.DATABASE_URL ?? "./data/xhw.db";
const dir = dirname(url);
if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });

const sqlite = new Database(url);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./lib/db/migrations" });

// Audit log table (out-of-band, idempotent).
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    admin_handle TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    detail TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS audit_log_created ON audit_log(created_at);
`);

// Full-text search over post bodies (FTS5). Created idempotently outside drizzle.
sqlite.exec(`
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
`);

console.log("migrations + FTS applied");
sqlite.close();
