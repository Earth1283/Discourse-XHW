# 08 — Identity & Auth

Three identity layers, from weakest to strongest:

| Layer | Mechanism | Persistence | Purpose |
|-------|-----------|-------------|---------|
| **Anonymous** (default) | nothing | — | Every post is `Anonymous` |
| **Poster token** | `xhw_pt` httpOnly cookie (nanoid) | per device | Enables 180-min self-delete; not shown to others |
| **Tripcode** | `name#secret` → salted hash | none (stateless) | Prove "same anon" across posts, no account |
| **Handle** (optional) | `users` row + JWT session | account | Persistent display name; can log in anywhere |
| **Admin** (you) | `users` row, `role=admin` | account | Full moderation powers |

## 1. Anonymous + poster token
Covered in `03`. Every first post mints `xhw_pt`. The DB stores it on each post; `toPostDTO` compares it to the requester's cookie to set `ownPost`. **Never** sent to other clients.

> Limitation to accept: poster token is per-device. Clearing cookies loses the ability to self-delete old posts. That's intended — it's a convenience, not an identity.

## 2. Tripcodes
`parseName("Vivi#hunter2")` → `{ name: "Vivi", tripcode: "!a1b2c3d4e5" }`. Stored on the post; rendered as `Vivi !a1b2c3d4e5` with the tripcode in accent color + mono. Same secret always yields the same tripcode (salted server-side), so people recognize a persistent anon without any account. Bare `Vivi` (no `#`) is just a display name with no proof.

## 3. Optional handles
- `POST /api/auth/handle` claims a free handle (creates `users` row, `role=user`) or logs into an existing one (bcrypt compare).
- Session = signed JWT in `xhw_session` (httpOnly, 30d).
- When a logged-in user posts, the composer offers a toggle: **post as `@handle`** vs **post anonymously** (default stays anonymous — the anon culture is the point). If posting as handle, `authorHandle` is set; otherwise null.
- Handle uniqueness enforced by `users_handle_unique` index. Reserve `admin`, `mod`, `anonymous`, etc. in a denylist.

```ts
const RESERVED = new Set(["admin", "mod", "moderator", "anonymous", "system", "xhw"]);
if (RESERVED.has(handle.toLowerCase())) throw new HttpError(400, "RESERVED", "Handle not allowed.");
```

## 4. Master admin account
- Seeded on first boot from `ADMIN_HANDLE` / `ADMIN_PASSWORD` (see `02-database.md` seed). Idempotent.
- Logs in via `/admin/login` → `POST /api/auth/admin`, which **only** issues a session if `role === "admin"`.
- Admin powers (all re-checked server-side with `requireAdmin()` on every call):
  - Delete any post/thread (soft or hard purge)
  - Pin / lock / archive threads
  - Create / rename / reorder boards; mark a board `adminOnlyPost`
  - View + resolve reports
  - Ban / unban by `ip_hash`
- Rotate the admin password by changing env + re-running seed *won't* update an existing row — add a `db:reset-admin` script that updates `passwordHash` for the admin handle.

## 5. Security notes
- bcrypt cost 12. Never log passwords.
- Admin login route: stricter rate limit (e.g. 5 attempts / 15 min per ipHash) + constant-time compare via bcrypt.
- Sessions are stateless JWTs; to force-logout everyone, rotate `SESSION_SECRET`.
- `getSession()` failures (expired/tampered) return `null`, never throw to the user.
- All auth cookies: `httpOnly`, `secure`, `sameSite: "lax"`.
- CSRF: mutations are same-origin `fetch` with cookies; enforce `sameSite=lax` + check `Origin` header on state-changing API routes for defense in depth.

```ts
// origin check helper used in POST/DELETE routes
function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && new URL(origin).host !== host)
    throw new HttpError(403, "BAD_ORIGIN", "Cross-origin blocked.");
}
```

## Exit criteria
- Anonymous posting works with zero account.
- Same `#secret` reliably reproduces the same tripcode; different secret differs.
- Handle claim → logout → login round-trips; reserved handles rejected.
- Admin login works only for the seeded admin; `requireAdmin()` blocks everyone else on every admin API.
