import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { config } from "../config";
import * as schema from "./schema";

// Ensure the data directory exists before opening the file.
const dir = dirname(config.databaseUrl);
if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });

const sqlite = new Database(config.databaseUrl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
export { schema, sqlite };
