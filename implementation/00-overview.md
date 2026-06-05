# SSBS Implementation Guide — Overview

This folder is the **build manual** for SSBS. `plan.md` (repo root) is the *what & why*; these files are the *how*, in build order.

## Read order

| # | File | Covers |
|---|------|--------|
| 00 | `00-overview.md` | Conventions, env, how to use this guide (this file) |
| 01 | `01-setup-scaffold.md` | Create the Next.js app, deps, folder layout, config |
| 02 | `02-database.md` | Drizzle schema, SQLite client, migrations, seeding |
| 03 | `03-validation-and-lib.md` | Shared zod schemas, helpers, cookies, rate limiter |
| 04 | `04-api-routes.md` | Every Route Handler, request→response contracts |
| 05 | `05-frontend-design-system.md` | Tailwind theme, tokens, base components, typography |
| 06 | `06-frontend-pages.md` | Board catalog, thread view, post composer |
| 07 | `07-optimistic-ui.md` | TanStack Query mutations, optimistic add/delete/rollback |
| 08 | `08-identity-auth.md` | Anon poster tokens, tripcodes, optional handles, admin |
| 09 | `09-images.md` | Upload pipeline, sharp re-encode, EXIF strip, thumbnails |
| 10 | `10-moderation-safety.md` | Rate limiting, reports, bans, rules gate, admin console |
| 11 | `11-testing-and-deploy.md` | Vitest, Playwright, build, deploy, persistence |

## Conventions

- **Language:** TypeScript, `strict: true`. No `any` in committed code.
- **IDs:** `nanoid(10)` for threads/posts/users. Boards use human short codes (`gen`, `rant`).
- **Timestamps:** stored as `INTEGER` epoch milliseconds (`Date.now()`).
- **Money path for data:** UI → TanStack Query → Route Handler → zod parse → service fn → Drizzle → SQLite. Keep DB access out of components.
- **Soft delete:** never hard-delete posts in normal flow; set `deleted_at` + `deleted_by`. Only admin "hard purge" removes rows.
- **Never render** raw IPs, `ip_hash`, or `poster_token` to the client.
- **Errors:** Route Handlers return `{ error: { code, message } }` with proper HTTP status. Client maps `code` → toast.

## Environment variables (`.env.local`)

```bash
# Database
DATABASE_URL=./data/ssbs.db

# Auth / crypto
SESSION_SECRET=<32+ random bytes, base64>     # signs session JWTs
IP_HASH_SALT=<32+ random bytes>               # salts ip_hash, server-only
TRIPCODE_SALT=<random>                          # salts tripcode hashing

# Master admin (seeded on first boot)
ADMIN_HANDLE=admin
ADMIN_PASSWORD=<set a strong one>

# Uploads
UPLOAD_DIR=./uploads
MAX_UPLOAD_BYTES=8388608                        # 8 MB
MAX_IMAGE_DIM=2000                              # px, longest edge

# Board behavior
MAX_LIVE_THREADS_PER_BOARD=100
SELF_DELETE_WINDOW_MS=10800000                  # 180 min

# Rate limits (per window)
RL_POST_PER_MIN=4
RL_THREAD_PER_10MIN=3
RL_UPLOAD_PER_MIN=4
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Definition of done (per feature)

1. zod schema exists and is shared client+server.
2. Route Handler validates, rate-limits, and returns typed errors.
3. UI mutation is optimistic with rollback.
4. At least one Vitest unit test for the service fn.
5. No raw secrets/IPs leak to the client bundle or responses.
