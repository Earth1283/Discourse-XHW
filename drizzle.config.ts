import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "sqlite",
  dbCredentials: { url: process.env.DATABASE_URL ?? "./data/xhw.db" },
} satisfies Config;
