# 11 — Testing & Deployment

## Testing strategy

| Layer | Tool | What to cover |
|-------|------|---------------|
| Unit | Vitest | services (`createThread`, `createReply`, `canSelfDelete`, prune), helpers (`parseName`, `hashIp`, `renderBody`, `rateLimit`) |
| Integration | Vitest + in-memory SQLite | Route Handler logic against a real (temp) DB |
| E2E smoke | Playwright | rules gate → post thread → reply → self-delete → admin delete |

### Vitest config — `vitest.config.ts`
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], globals: true },
});
```

### Test DB pattern
Spin a fresh SQLite file (or `:memory:`) per suite, run migrations, seed minimal data, tear down. Factor `createDb(url)` so tests inject their own DB instead of the singleton.

```ts
// tests/factory.ts
export function freshDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./lib/db/migrations" });
  return db;
}
```

### Critical unit tests (must exist)
- `parseName`: bare name, `name#trip`, blank → Anonymous, same secret → same trip, different secret → different.
- `canSelfDelete`: token match inside window = true; wrong token = false; past window = false; already deleted = false.
- prune: inserting beyond `MAX_LIVE_THREADS` archives the oldest-bumped non-pinned thread; pinned threads never pruned.
- `renderBody`: greentext, `>>id` quote, URL, spoiler, mixed line.
- `toPostDTO`: output object has **no** `ipHash` / `posterToken` keys (guard against leak).
- `rateLimit`: allows up to max, blocks after, refills over time.

### Playwright smoke — `tests/e2e/flow.spec.ts`
1. Visit `/` → rules gate visible → click agree → gate gone, reload → still gone.
2. Open a board → create thread (with image) → redirected to thread → OP visible with thumb.
3. Post a reply → appears optimistically → persists after reload.
4. Delete own reply within window → shows `[deleted]`.
5. Log in as admin → delete someone's post → gone for everyone.

## CI (GitHub Actions sketch)
```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run db:generate && npm run db:migrate
        env: { DATABASE_URL: ./data/ci.db, SESSION_SECRET: x, IP_HASH_SALT: x, TRIPCODE_SALT: x, ADMIN_HANDLE: admin, ADMIN_PASSWORD: changeme123 }
      - run: npm run lint
      - run: npm test
      - run: npx playwright install --with-deps && npm run build && npm run e2e
```

## Build & run
```bash
npm run build
npm run start          # serves on :3000
```

## Deployment

SQLite + local image files means **the app needs a persistent disk and is effectively single-instance**. Don't deploy to ephemeral/serverless filesystems without external storage.

### Recommended: single VPS (or Fly.io / Railway with a volume)
- Mount a persistent volume; put both `data/xhw.db` and `uploads/` on it.
- Run Node behind **nginx/Caddy** as a reverse proxy:
  - terminate TLS (Caddy auto-HTTPS)
  - serve `/uploads/**` directly from disk (skip Node for static images)
  - set real client IP header (`X-Forwarded-For`) so `clientIp()` works — and make sure the proxy is the only thing setting it (otherwise XFF can be spoofed → breaks rate limiting/bans).
- Process manager: `pm2` or a systemd unit; `npm run start`.
- Backups: nightly copy of the SQLite file (use `sqlite3 .backup` or `better-sqlite3`'s `.backup()` for a consistent snapshot under WAL) + `uploads/` to off-box storage.

### Caddyfile sketch
```
xhw.example.edu {
  encode zstd gzip
  handle_path /uploads/* {
    root * /srv/xhw/uploads
    file_server
  }
  reverse_proxy 127.0.0.1:3000 {
    header_up X-Forwarded-For {remote_host}
  }
}
```

### Env in prod
- Set all secrets from `00-overview.md` via the host's secret manager / env, **not** committed.
- `NODE_ENV=production`. Ensure cookies are `secure` (they are) → site must be HTTPS.

### Scaling note
If you ever need multiple app instances: move sessions are already stateless (JWT) ✓; but (a) SQLite single-writer and (b) in-process rate limiter and (c) local image disk all assume one node. Migration path: Postgres + Redis (rate limit) + S3 (images) — the service/storage abstractions make this incremental.

## Pre-launch checklist
- [ ] Secrets generated, set, and backed up (esp. `IP_HASH_SALT`).
- [ ] Admin account seeded; password changed from any placeholder.
- [ ] Rules text reviewed with whoever is accountable at the school.
- [ ] EXIF-strip verified on a real photo.
- [ ] Rate limits tuned; ban flow tested.
- [ ] Backups scheduled and a restore tested once.
- [ ] HTTPS enforced; proxy sets trusted `X-Forwarded-For`.
- [ ] Takedown/escalation contact documented.
