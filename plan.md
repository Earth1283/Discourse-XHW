# XHW Life — Project Plan

> **XHW Life** is an anonymous imageboard-style forum modeled on 4chan, built for a school community. The *content* is meant to feel raw and unhinged; the *interface* is the opposite — minimal, sleek, fast, and modern. Think "chaotic energy wrapped in a clean Scandinavian shell."

---

## 1. Vision & Tone

| Dimension | Direction |
|-----------|-----------|
| **Content culture** | Anonymous, fast-moving, irreverent, meme-heavy. No karma, no follower counts, no profile flexing. Threads bump on reply and die when they fall off the page. |
| **Visual design** | Minimal and modern. Generous whitespace, restrained palette, crisp typography, subtle motion. *No* skeuomorphic "old imageboard" look. |
| **Feel** | Instant. Optimistic UI everywhere — posting feels like it already happened before the server confirms. |

The contrast is the whole brand: ugly thoughts, beautiful container.

---

## 2. Decisions (locked)

These were confirmed up front and drive the architecture:

- **Backend:** Node.js
- **Frontend:** Next.js (App Router) + React + Tailwind CSS
- **Database:** SQLite (single-file, zero-config)
- **Identity:** Anonymous by default. Optional persistent handles for users who want one. Posts show `Anonymous` unless a handle is chosen. **One master admin account** (me) with elevated powers.
- **Moderation posture:** Bare minimum by design — admin delete + rate limiting. Content-permissive.
- **Rules gate:** On first visit, show RULES + a **liability waiver** the user must explicitly accept (checkbox). Acceptance is stored in a versioned cookie so it isn't shown again unless the rules/waiver change. The waiver states the author(s)/operator(s) are **not liable** for anything on the site and the user uses it at their own risk.
- **Self-service deletion:** A user can delete their *own* post within **180 minutes** of posting.
- **Optimistic UI:** Posting, replying, and deleting update the UI immediately, then reconcile with the server.
- **Images optional:** Posts (both new threads and replies) are allowed with **no image** — text-only is fully supported.
- **Lossless image compression:** Uploaded images are re-encoded to **lossless WebP** (thumbnails near-lossless), so re-encoding adds no quality loss.

---

## 3. Tech Stack

### Frontend
- **Next.js 15** (App Router, React Server Components where useful, Client Components for interactive board/thread views)
- **Tailwind CSS** for styling
- **lucide-react** for icons (clean, minimal line icons)
- **TanStack Query** (React Query) for data fetching + optimistic mutations
- **zod** for client + server input validation (shared schemas)

### Backend
- **Next.js Route Handlers** (`app/api/**`) as the Node API layer — keeps it one deployable unit. (If the API grows, it can be split into a standalone Express/Fastify service later; the data layer is isolated to make that cheap.)
- **better-sqlite3** — synchronous, fast, simple SQLite driver
- **Drizzle ORM** — typed schema + migrations over SQLite
- **sharp** — image processing (resize, strip EXIF, generate thumbnails)
- **bcrypt** — hash admin + optional-handle passwords
- **jose** — signed JWT/session cookies
- **nanoid** — short IDs for threads/posts

### Infra / tooling
- **TypeScript** throughout
- **ESLint + Prettier**
- **Vitest** for unit tests, **Playwright** for a thin e2e smoke suite
- File-based image storage on disk (`/uploads`) for v1; abstracted behind a storage interface so it can move to S3-compatible storage later
- **dotenv** for config

---

## 4. Information Architecture

```
XHW Life
├── /                     Landing — board index ("the catalog of boards")
├── /b/[board]            Board view — thread catalog (cards / grid)
├── /b/[board]/[thread]   Thread view — OP + replies
├── /rules                Full rules text (also shown in first-visit modal)
├── /admin                Admin console (master account only)
└── /handle               Optional: claim / manage a persistent handle
```

### Boards (initial set — tune to the school)
Short codes, 4chan-style. Examples:
- `/gen/` — General
- `/rant/` — Rants & confessions
- `/hw/` — Homework / classes
- `/ann/` — Announcements (admin-postable, anyone-readable)
- `/random/` — Off-topic / chaos

Boards are seeded from a config file/DB table so they're easy to add or rename without code changes.

---

## 5. Data Model (SQLite via Drizzle)

```
boards
  id            TEXT PK        -- e.g. "gen"
  name          TEXT           -- "General"
  description   TEXT
  sort_order    INTEGER
  created_at    INTEGER

threads
  id            TEXT PK        -- nanoid
  board_id      TEXT FK -> boards.id
  title         TEXT NULL      -- optional subject
  bumped_at     INTEGER        -- updated on each reply (drives ordering)
  reply_count   INTEGER        -- denormalized for fast catalog render
  is_locked     INTEGER (bool)
  is_pinned     INTEGER (bool)
  created_at    INTEGER

posts
  id            TEXT PK        -- nanoid; post #1 of a thread is the OP
  thread_id     TEXT FK -> threads.id
  board_id      TEXT FK        -- denormalized for moderation queries
  is_op         INTEGER (bool)
  author_handle TEXT NULL      -- null => "Anonymous"
  tripcode      TEXT NULL       -- derived, for anon identity-without-account
  body          TEXT
  image_path    TEXT NULL
  thumb_path    TEXT NULL
  poster_token  TEXT           -- opaque per-device token; enables 180-min self-delete
  ip_hash       TEXT           -- salted hash, for rate limiting & abuse (never shown)
  created_at    INTEGER
  deleted_at    INTEGER NULL   -- soft delete
  deleted_by    TEXT NULL      -- "self" | "admin"

users                          -- optional handles + the master admin
  id            TEXT PK
  handle        TEXT UNIQUE
  password_hash TEXT
  role          TEXT           -- "user" | "admin"
  created_at    INTEGER

reports                        -- minimal; just a flag queue for admin
  id            TEXT PK
  post_id       TEXT FK
  reason        TEXT NULL
  created_at    INTEGER
```

**Notes**
- **Replies** are just `posts` rows sharing a `thread_id`. The OP is `is_op = true`.
- **`poster_token`**: a random token set in a `httpOnly` cookie on first post. The 180-minute self-delete checks `poster_token` match + `created_at` window. No account needed.
- **`ip_hash`**: salted SHA-256 of IP, used only for rate limiting and admin abuse handling — never displayed.
- **Tripcodes**: classic 4chan `name#secret` → hashed suffix, so an anon can prove continuity across posts without an account.
- **Soft delete**: deleted posts keep their row (so thread structure / reply links survive) but render as `[deleted]`.

---

## 6. Core Features

### 6.1 Posting
- New thread: optional title + body + optional image. Body supports lightweight markup:
  - `>greentext`
  - `>>postId` quote-links (auto-anchor + hover preview)
  - URLs auto-linkified
  - Spoiler `[s]...[/s]`
- Replies bump the thread (`bumped_at = now`) unless "sage" is set.
- **Optimistic UI:** new post appears instantly with a "posting…" state, reconciles on server ack, rolls back + shows error on failure.

### 6.2 Reading
- **Board catalog:** responsive card grid — thumbnail, truncated OP, reply count, last-bump time. Sorted: pinned → `bumped_at` desc.
- **Thread view:** OP highlighted, replies below, quote-link hover previews, jump-to-post anchors.
- Auto-prune: when a board exceeds N active threads, the lowest-bumped non-pinned thread is archived/dropped (configurable).

### 6.3 Identity
- Default `Anonymous`.
- Optional **handle**: claim once (handle + password), then choose per-post whether to post under it.
- Optional **tripcode** for anons.
- **Master admin** account seeded via env vars on first boot (`ADMIN_HANDLE`, `ADMIN_PASSWORD`) → hashed into `users` with `role = admin`.

### 6.4 Self-service deletion (180 min)
- Each device gets a `poster_token` cookie.
- A post shows a "Delete" affordance only if the current token owns it **and** it's within 180 minutes.
- Deletion is a soft delete (`deleted_by = "self"`), optimistic in the UI.

### 6.5 Rules gate + liability waiver
- First visit (no `xhw_rules_accepted` cookie, or an outdated version) → blocking modal showing the conduct RULES **and** a prominent **liability waiver**.
- The waiver makes clear: all content is user-created; the author(s)/operator(s) are **not responsible and not liable** for anything on the site; use is at your own risk; the user agrees to hold them harmless.
- User must tick a checkbox (confirming age ≥ 13 + agreement to rules + acceptance of the waiver) before the "I understand and agree" button enables.
- Acceptance sets a long-lived **versioned** cookie; bumping `RULES_VERSION` (e.g. after editing the waiver) re-prompts everyone. Optionally stamped server-side on first post for an audit trail.
- `/rules` page always available for re-reading (same single source as the modal).
- ⚠️ A click-through waiver is a clear statement of intent, **not** ironclad legal protection — especially with minors. Have whoever is legally accountable review it. Not legal advice.

### 6.6 Admin console (`/admin`)
- Login (master account).
- Delete any post/thread (hard or soft), pin/lock threads, create/rename/reorder boards.
- View report queue.
- View basic abuse signals (recent posts per `ip_hash`, rate-limit hits).
- Audit: deletions log `deleted_by = "admin"`.

---

## 7. Safety & Abuse Controls (baseline — non-negotiable even in "bare minimum")

> A public, content-permissive board used by a school community carries real legal and safety exposure (harassment, doxxing, illegal content, content involving minors). The plan keeps the *vibe* loose but the *floor* hard.

- **Rate limiting:** per-`ip_hash` + per-`poster_token` throttle on posting and image upload (e.g. token bucket; configurable). Blocks flooding/spam.
- **Image hardening:** `sharp` re-encodes all uploads → strips EXIF/GPS metadata, enforces max dimensions + file size, whitelists MIME types (jpg/png/gif/webp).
- **Report button** on every post → feeds the admin queue.
- **Admin delete + ban** (ban by `ip_hash`, soft and reversible).
- **Rules acceptance** recorded (cookie + timestamp) so there's a clear "you agreed" trail.
- **Spam/link controls:** basic flood detection + optional new-post link limits.
- **No public IPs/identities ever rendered.** Raw IPs are hashed at the edge with a server-side salt.
- **Takedown path:** documented admin workflow for removing illegal/harmful content fast.

> ⚠️ **Out-of-code obligations** the operator (you) should own before launch: confirm school/district acceptable-use policy, decide what content is genuinely disallowed (CSAM, threats, doxxing, targeted harassment — all illegal regardless of "vibe"), and have a real-person escalation path. The software gives you the controls; policy is on the operator.

---

## 8. Visual Design Direction

**Principle:** minimal chrome, maximum content. The UI gets out of the way so the chaos reads cleanly.

- **Layout:** centered max-width column on thread pages; full-bleed responsive grid on catalogs. Lots of breathing room.
- **Palette:** near-monochrome base (off-white / near-black) + a single sharp accent color (e.g. acid green or electric blue) used sparingly for actions, greentext, and active states. Dark mode first-class.
- **Typography:** one clean variable sans (Inter / Geist) for UI; a mono (JetBrains Mono / Geist Mono) for post metadata and IDs — gives it a subtle "terminal" edge without being retro.
- **Motion:** restrained. Optimistic posts fade/slide in. Hover previews on quote-links. No bouncy gimmicks.
- **Components:** flat cards, hairline borders, soft focus rings. Sticky minimal top bar (board switcher + post button). Mobile-first.
- Built with the `frontend-design` skill to avoid generic AI-template aesthetics.

---

## 9. API Surface (Route Handlers)

```
GET    /api/boards                       list boards
GET    /api/boards/:board/threads        catalog (paginated)
POST   /api/boards/:board/threads        create thread (+image)
GET    /api/threads/:id                  thread + posts
POST   /api/threads/:id/posts            reply (+image)
DELETE /api/posts/:id                    self-delete (token+window) OR admin
POST   /api/posts/:id/report             flag for admin
POST   /api/auth/handle                  claim/login optional handle
POST   /api/auth/admin                   admin login
GET    /api/admin/reports                admin: report queue
POST   /api/admin/boards                 admin: create/edit boards
POST   /api/admin/threads/:id            admin: pin/lock/delete
```

All inputs validated with shared `zod` schemas. All mutations rate-limited.

---

## 10. Build Phases

### Phase 0 — Scaffold
- Next.js + TS + Tailwind project, ESLint/Prettier, folder structure.
- Drizzle + better-sqlite3 wired up; first migration; seed boards + master admin from env.

### Phase 1 — Core read/write
- Board catalog + thread view (server-rendered).
- Create thread + reply (no images yet), with `zod` validation + rate limiting.
- `poster_token` cookie + soft delete + 180-min self-delete.
- Greentext / quote-links / autolink rendering.

### Phase 2 — Optimistic UI + polish
- TanStack Query mutations with optimistic add/delete + rollback.
- Quote-link hover previews, jump anchors, bump ordering, auto-prune.
- Rules-acceptance modal + cookie; `/rules` page.

### Phase 3 — Images
- Upload pipeline via `sharp` (re-encode, strip EXIF, thumbnails), storage abstraction, board catalog thumbnails, spoiler images.

### Phase 4 — Identity
- Optional handles (claim/login), tripcodes, per-post identity selection.

### Phase 5 — Admin & safety
- Admin console (login, delete/pin/lock, board management).
- Report queue, `ip_hash` ban list, abuse signals, audit logging.

### Phase 6 — Hardening & launch
- Rate-limit tuning, image-size/MIME enforcement, full-text search (SQLite FTS5).
- Vitest unit tests + Playwright smoke suite.
- Deploy (single Node host; persistent disk for SQLite file + `/uploads`).

---

## 11. Open Questions / Decisions Deferred

1. **Board list** — confirm the actual boards + short codes you want for the school.
2. **Auto-prune threshold** — how many live threads per board before old ones drop? (default: 100)
3. ~~Image uploads required or optional on new threads?~~ **Decided:** optional everywhere — text-only posts allowed; images stored lossless.
4. **Hosting target** — single VPS vs. a platform (Render/Railway/Fly). Affects how the SQLite file + uploads persist.
5. **Accent color** — pick one (acid green / electric blue / hot magenta) for the design system.
6. **"Unhinged" floor** — final list of content that is hard-disallowed (separate from the permissive default).

---

## 12. Repo Layout (target)

```
/app                  Next.js App Router (pages + route handlers)
  /(site)             public board UI
  /admin              admin console
  /api                route handlers
/components           React UI components
/lib
  /db                 drizzle schema, client, migrations
  /storage            image storage abstraction
  /validation         shared zod schemas
  /auth               session/cookie/tripcode helpers
  /ratelimit          throttling
/public
/uploads              image storage (gitignored)
/tests                vitest + playwright
plan.md               this file
```
