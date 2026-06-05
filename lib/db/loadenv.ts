// Loads env for standalone tsx scripts (migrate/seed). Next.js loads these
// automatically for the app; CLI scripts do not, so we load them explicitly.
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"], quiet: true });
