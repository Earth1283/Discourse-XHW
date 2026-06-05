// Required env vars for lib/config (read at module load time)
process.env.SESSION_SECRET = "test-session-secret-xxxxxxxxxxxxxxxx";
process.env.IP_HASH_SALT = "test-ip-hash-salt";
process.env.TRIPCODE_SALT = "test-tripcode-salt";
process.env.ADMIN_HANDLE = "testadmin";
process.env.ADMIN_PASSWORD = "testpassword123";
process.env.DATABASE_URL = ":memory:";
process.env.MAX_LIVE_THREADS_PER_BOARD = "3";
process.env.SELF_DELETE_WINDOW_MS = String(180 * 60 * 1000);
