import "server-only";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  return v ? Number(v) : fallback;
}

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? "./data/xhw.db",
  sessionSecret: req("SESSION_SECRET"),
  ipHashSalt: req("IP_HASH_SALT"),
  tripcodeSalt: req("TRIPCODE_SALT"),
  admin: { handle: req("ADMIN_HANDLE"), password: req("ADMIN_PASSWORD") },
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  maxUploadBytes: num("MAX_UPLOAD_BYTES", 8 * 1024 * 1024),
  maxImageDim: num("MAX_IMAGE_DIM", 2000),
  maxLiveThreads: num("MAX_LIVE_THREADS_PER_BOARD", 100),
  selfDeleteWindowMs: num("SELF_DELETE_WINDOW_MS", 180 * 60 * 1000),
  rl: {
    postPerMin: num("RL_POST_PER_MIN", 4),
    threadPer10Min: num("RL_THREAD_PER_10MIN", 3),
    uploadPerMin: num("RL_UPLOAD_PER_MIN", 4),
  },
} as const;
