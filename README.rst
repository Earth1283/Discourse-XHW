XHW Life
========

Anonymous school forum. Minimal UI, permissive content, 4chan-inspired.

Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, Drizzle ORM,
and SQLite (better-sqlite3). Single-binary, runs on any persistent-disk VPS.

.. contents::
   :depth: 2


Features
--------

**Posting**

- Anonymous by default; optional handle claim with password
- Tripcodes: ``name#secret`` → deterministic ``!XXXXXXXXXX`` suffix
- Post without image (image optional on every form)
- Lossless WebP re-encode + EXIF strip via sharp
- 360×360 near-lossless thumbnail generated automatically
- Optimistic UI — replies appear instantly, roll back on error
- Self-delete own posts within 180 minutes
- Sage: reply without bumping thread
- Dupe guard: same token + same body within 30 s → 429
- Link cap: new poster tokens capped at 2 URLs per post

**Boards & threads**

- Multiple boards (seeded: gen, rant, tech, creative, anon)
- Thread catalog with thumbnail banner, excerpt, reply count
- Load-more pagination (30 threads/page, SSR first page)
- Thread title optional
- Auto-prune: oldest-bumped non-pinned threads archived when board exceeds cap
- FTS5 full-text search over post bodies (search bar in top nav)

**Identity & auth**

- Anonymous poster token (httpOnly cookie, survives session)
- Optional handle registration (bcrypt cost 12)
- Admin account (seeded from env, role-gated throughout)
- JWT sessions (jose, 30-day, httpOnly + secure + sameSite=lax)

**Moderation**

- Rate limits: 4 posts/min, 3 threads/10 min, 4 uploads/min (token-bucket)
- Report queue with reason; de-duped per post
- IP banning (salted HMAC hash — raw IPs never stored)
- Soft delete (marks ``deleted_at``, body redacted client-side)
- Hard purge (removes DB row + image files from disk)
- Thread management: lock, unlock, pin, unpin, archive
- Board management: create, rename, toggle ``adminOnlyPost``, delete (empty only)
- Orphan image cleanup: removes files for posts deleted > 30 days
- Audit log: every admin action recorded with handle + timestamp

**Safety**

- Liability waiver + rules gate on first visit (cookie-persisted, versioned)
- ``server-only`` enforced on all server modules
- ``ipHash``/``posterToken`` never sent to client (stripped by ``toPostDTO``)
- CSRF: ``assertSameOrigin`` on every state-changing route
- CSP headers: ``Content-Security-Policy``, ``X-Frame-Options: DENY``,
  ``X-Content-Type-Options``, ``Referrer-Policy``, ``Permissions-Policy``
- Path-traversal guard on ``/uploads/`` static route


Quick start
-----------

Prerequisites: Node.js 20+, npm.

.. code-block:: bash

   git clone <repo>
   cd xhw-life

   cp .env.example .env.local
   # edit .env.local — set SESSION_SECRET, IP_HASH_SALT, TRIPCODE_SALT, ADMIN_PASSWORD

   npm install
   npm run db:migrate
   npm run db:seed

   npm run dev          # http://localhost:3000

Generate secrets::

   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

Run that three times — one value each for ``SESSION_SECRET``, ``IP_HASH_SALT``,
``TRIPCODE_SALT``.


Environment variables
---------------------

.. list-table::
   :header-rows: 1
   :widths: 30 10 60

   * - Variable
     - Required
     - Description
   * - ``DATABASE_URL``
     - no
     - SQLite file path. Default: ``./data/xhw.db``
   * - ``SESSION_SECRET``
     - **yes**
     - Signs JWT session cookies. 32+ random bytes.
   * - ``IP_HASH_SALT``
     - **yes**
     - HMAC salt for IP hashing. Keep secret; losing it breaks ban correlation.
   * - ``TRIPCODE_SALT``
     - **yes**
     - Salt for tripcode hashing.
   * - ``ADMIN_HANDLE``
     - **yes**
     - Handle for the seeded admin account.
   * - ``ADMIN_PASSWORD``
     - **yes**
     - Password for the seeded admin account. Change from default.
   * - ``UPLOAD_DIR``
     - no
     - Directory for uploaded images. Default: ``./uploads``
   * - ``MAX_UPLOAD_BYTES``
     - no
     - Max upload size in bytes. Default: 8388608 (8 MB)
   * - ``MAX_IMAGE_DIM``
     - no
     - Max image dimension (px, longest edge). Default: 2000
   * - ``MAX_LIVE_THREADS_PER_BOARD``
     - no
     - Threads per board before oldest is archived. Default: 100
   * - ``SELF_DELETE_WINDOW_MS``
     - no
     - Self-delete window in ms. Default: 10800000 (180 min)
   * - ``RL_POST_PER_MIN``
     - no
     - Max posts per minute per IP. Default: 4
   * - ``RL_THREAD_PER_10MIN``
     - no
     - Max new threads per 10 min per IP. Default: 3
   * - ``RL_UPLOAD_PER_MIN``
     - no
     - Max image uploads per minute per IP. Default: 4


npm scripts
-----------

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Script
     - Description
   * - ``npm run dev``
     - Start Next.js dev server (hot reload)
   * - ``npm run build``
     - Production build
   * - ``npm run start``
     - Serve production build on ``:3000``
   * - ``npm run lint``
     - ESLint (flat config, Next.js + TypeScript rules)
   * - ``npm test``
     - Vitest unit tests (35 tests)
   * - ``npm run e2e``
     - Playwright smoke tests (requires running app or CI webServer)
   * - ``npm run db:migrate``
     - Apply Drizzle migrations + FTS5 + audit_log table
   * - ``npm run db:seed``
     - Seed boards + admin account (idempotent)
   * - ``npm run db:generate``
     - Regenerate Drizzle migration files after schema changes


API routes
----------

Public
~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 10 40 50

   * - Method
     - Path
     - Description
   * - GET
     - ``/api/boards``
     - List all boards with live thread count
   * - GET
     - ``/api/boards/[board]/threads?page=N``
     - Board catalog (30/page, sorted by bump)
   * - POST
     - ``/api/boards/[board]/threads``
     - Create thread (multipart/form-data)
   * - GET
     - ``/api/threads/[id]``
     - Thread + all posts
   * - POST
     - ``/api/threads/[id]/posts``
     - Reply (multipart/form-data)
   * - DELETE
     - ``/api/posts/[id]``
     - Soft-delete (self within 180 min, or admin)
   * - POST
     - ``/api/posts/[id]/report``
     - Report a post (rate-limited 10/10 min)
   * - GET
     - ``/api/search?q=...&board=...``
     - FTS5 post search
   * - POST
     - ``/api/auth/handle``
     - Claim or log in to a handle
   * - POST
     - ``/api/auth/admin``
     - Admin login
   * - POST
     - ``/api/auth/logout``
     - Destroy session
   * - GET
     - ``/api/auth/me``
     - Current session info

Admin (require admin session)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 10 40 50

   * - Method
     - Path
     - Description
   * - GET
     - ``/api/admin/reports``
     - Open report queue
   * - PATCH
     - ``/api/admin/reports/[id]``
     - Resolve or delete-post on a report
   * - GET/POST
     - ``/api/admin/boards``
     - List boards / create board
   * - PATCH/DELETE
     - ``/api/admin/boards/[id]``
     - Update or delete a board
   * - PATCH
     - ``/api/admin/threads/[id]``
     - Lock/unlock/pin/unpin/archive thread
   * - GET
     - ``/api/admin/search/threads?q=...``
     - Search threads by title or ID
   * - POST
     - ``/api/admin/posts/[id]/ban``
     - Ban the poster of a post (by ipHash)
   * - DELETE
     - ``/api/admin/posts/[id]/purge``
     - Hard-purge post (row + image files)
   * - GET/POST
     - ``/api/admin/bans``
     - List bans / add ban
   * - DELETE
     - ``/api/admin/bans/[hash]``
     - Lift a ban
   * - POST
     - ``/api/admin/purge-orphans``
     - Delete image files for posts deleted > 30 days
   * - GET
     - ``/api/admin/audit``
     - Admin action history (last 200 entries)


Architecture
------------

.. code-block:: text

   app/
     (site)/          Next.js pages (public)
     admin/           Admin pages (session-gated server component)
     api/             Route Handlers (all runtime = "nodejs")
     uploads/[...path]/  Static image serving (path-traversal guard)

   components/
     layout/          TopBar (search bar, auth menu, theme toggle)
     board/           ThreadCard, CatalogLoadMore
     thread/          ThreadView, Post, PostBody, ReplyComposer,
                      DeleteButton, ReportButton
     admin/           AdminDashboard (6 tabs)
     ui/              Toaster
     RulesGate        First-visit consent modal

   lib/
     auth/            JWT sessions, poster tokens, IP hash, tripcodes
     db/
       schema.ts      Drizzle table definitions
       client.ts      Singleton WAL SQLite connection
       migrate.ts     Applies migrations + FTS5 + audit_log
       seed.ts        Board + admin seed (self-contained, no server-only)
       dto.ts         toPostDTO — strips ipHash/posterToken
       services/      boards, threads, posts, users, reports,
                      bans, audit, search, purge
     format/          renderBody — typed Line/Segment AST (no HTML injection)
     ratelimit/       Token-bucket rateLimit + assertNotDupe (dupe guard)
     upload/          parseMultipart, processAndStore (sharp WebP pipeline)
     validation/      Zod schemas, assertLinkCap
     http/            HttpError, errorResponse
     guards/          assertNotBanned, assertSameOrigin (CSRF)
     query/           TanStack Query key factory
     hooks/           useSession

**Data flow**::

   UI → apiFetch → Route Handler
        → zod parse → assertSameOrigin → assertNotBanned → rateLimit
        → service fn → Drizzle → SQLite
        → toPostDTO (strips secrets) → Response.json

**No raw IPs, ipHash, or posterToken ever reach the client.**


Testing
-------

Unit tests (Vitest, 35 tests)::

   npm test

Coverage:

- ``renderBody`` — greentext, ``>>id`` quote, URL, spoiler, mixed lines
- ``parseName`` — bare name, ``name#trip``, same secret = same trip
- ``rateLimit`` — allows up to max, blocks after, refills over time
- ``toPostDTO`` — no ``ipHash``/``posterToken`` in output, canDeleteUntil logic
- ``canSelfDelete`` — token match, window expiry, already-deleted
- ``softDeletePost`` — sets ``deletedAt`` + ``deletedBy``
- Prune — archives oldest non-pinned thread; pinned threads never pruned

Playwright e2e (requires running app)::

   npm run e2e

Smoke flow: rules gate → post thread → reply → self-delete → admin delete.


Deployment
----------

SQLite + local image files = **single-instance only**. Use a VPS or
Fly.io/Railway with a persistent volume.

1. Mount a volume; put ``data/`` and ``uploads/`` on it.
2. Set all env vars via your host's secret manager.
3. Run ``NODE_ENV=production npm run db:migrate && npm run db:seed``.
4. Start with ``npm run start`` or the provided systemd unit::

      cp deploy/xhw-life.service /etc/systemd/system/
      systemctl enable --now xhw-life

5. Reverse-proxy with Caddy (auto-HTTPS + static image serving)::

      cp deploy/Caddyfile /etc/caddy/Caddyfile
      # edit domain
      systemctl reload caddy

   The Caddyfile serves ``/uploads/*`` directly from disk (skips Node) and
   passes real client IP via ``X-Forwarded-For``.

**Backups**::

   # Consistent SQLite snapshot under WAL
   sqlite3 ./data/xhw.db ".backup ./backups/xhw-$(date +%Y%m%d).db"
   # Also back up uploads/
   tar -czf ./backups/uploads-$(date +%Y%m%d).tar.gz ./uploads

Schedule nightly and copy off-box.

**Pre-launch checklist**

- [ ] Secrets generated, set, and backed up (especially ``IP_HASH_SALT``)
- [ ] Admin password changed from placeholder
- [ ] Rules text reviewed with whoever is accountable at the school
- [ ] EXIF strip verified on a real photo
- [ ] Rate limits tuned; ban flow tested end-to-end
- [ ] Backups scheduled and a restore tested once
- [ ] HTTPS enforced; reverse proxy is the only thing setting ``X-Forwarded-For``
- [ ] Takedown/escalation contact documented


License
-------

Private. Not for redistribution.

.. warning::

   A public, anonymous board used by minors is a genuine liability surface.
   The operator (you) is responsible for policy, takedown procedures, and
   compliance with applicable law. The liability waiver in the app is not a
   substitute for operator accountability.
