import "./loadenv";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import * as schema from "./schema";

// Standalone connection: this runs under tsx (outside Next), so it must not
// import modules that pull in `server-only` (e.g. lib/config, lib/db/client).
const url = process.env.DATABASE_URL ?? "./data/xhw.db";
const dir = dirname(url);
if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });

const sqlite = new Database(url);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

const adminHandle = process.env.ADMIN_HANDLE;
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminHandle || !adminPassword) {
  throw new Error("ADMIN_HANDLE and ADMIN_PASSWORD must be set to seed.");
}

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
    db.insert(schema.boards).values({ ...b, createdAt: now }).onConflictDoNothing().run();
  }
  console.log(`seeded ${seedBoards.length} boards`);

  const existing = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.handle, adminHandle!))
    .get();

  if (!existing) {
    db.insert(schema.users)
      .values({
        id: nanoid(10),
        handle: adminHandle!,
        passwordHash: await bcrypt.hash(adminPassword!, 12),
        role: "admin",
        createdAt: now,
      })
      .run();
    console.log(`seeded admin user: ${adminHandle}`);
  } else {
    console.log(`admin user already exists: ${adminHandle}`);
  }

  console.log("seed complete");
  sqlite.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
