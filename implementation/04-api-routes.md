# 04 — API Route Handlers

Every mutation follows the same spine:

1. Parse + validate (zod).
2. Resolve identity (poster token / session) + hash IP.
3. Check ban list + rate limit.
4. Call the service fn.
5. Return typed JSON; map errors via `errorResponse`.

All handlers live under `app/api/**/route.ts` and run on the Node runtime:
```ts
export const runtime = "nodejs";
```

## Response shapes

```ts
// success
{ data: <T> }
// error
{ error: { code: string; message: string } }
```

Client-facing post DTO (never includes ipHash / posterToken):
```ts
type PostDTO = {
  id: string; threadId: string; isOp: boolean;
  name: string;            // resolved display name or "Anonymous"
  tripcode: string | null;
  body: string;            // raw; rendered client-side
  imagePath: string | null; thumbPath: string | null;
  createdAt: number;
  deleted: boolean;        // true => render [deleted], body suppressed
  ownPost: boolean;        // matches current poster token (drives delete button)
  canDeleteUntil: number | null; // createdAt + 180min if ownPost
};
```

`toPostDTO(post, posterToken, now)` is the single mapping fn — it strips secrets and computes `ownPost`/`canDeleteUntil`. Use it everywhere a post is serialized.

---

## `GET /api/boards`
List boards ordered by `sortOrder`. Public, cacheable.

```ts
export async function GET() {
  const data = listBoards();           // service
  return Response.json({ data });
}
```

## `GET /api/boards/[board]/threads?page=0`
Catalog. Returns thread cards (OP excerpt, thumb, reply count, bumpedAt). Excludes archived.

```ts
export async function GET(req: Request, { params }: { params: Promise<{ board: string }> }) {
  const { board } = await params;
  const page = Number(new URL(req.url).searchParams.get("page") ?? 0);
  const data = listThreadCards(board, page);
  return Response.json({ data });
}
```

## `POST /api/boards/[board]/threads`
Create a thread. Accepts `multipart/form-data` (body fields + optional image) **or** JSON (no image).

```ts
export async function POST(req: Request, { params }: { params: Promise<{ board: string }> }) {
  try {
    const { board } = await params;
    const ip = clientIp(req); const ipHash = hashIp(ip);
    assertNotBanned(ipHash);

    const token = await getOrCreatePosterToken();
    if (!rateLimit(`${ipHash}:thread`, config.rl.threadPer10Min, 10 * 60_000))
      throw new HttpError(429, "RATE_LIMITED", "Slow down.");

    const { fields, image } = await parseMultipart(req);  // see 09-images
    const input = CreateThreadSchema.parse(fields);

    const brd = getBoard(board);
    if (!brd) throw new HttpError(404, "NO_BOARD", "No such board.");
    if (brd.adminOnlyPost) {
      const s = await getSession();
      if (s?.role !== "admin") throw new HttpError(403, "FORBIDDEN", "Read-only board.");
    }

    const stored = image ? await processAndStore(image, ipHash) : null; // {imagePath, thumbPath}
    const { name, tripcode } = parseName(input.name);
    const { thread, op } = createThread({
      board, input, name, tripcode,
      image: stored, posterToken: token, ipHash,
    });
    return Response.json({ data: { thread, op: toPostDTO(op, token, Date.now()) } }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`createThread` also runs prune: if live (non-pinned, non-archived) thread count for the board > `MAX_LIVE_THREADS`, archive the lowest `bumpedAt`.

## `GET /api/threads/[id]`
Thread + all posts. Maps each post via `toPostDTO` with the caller's poster token.

```ts
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getPosterToken();
  const res = getThreadWithPosts(id);
  if (!res) throw_404();
  return Response.json({
    data: { thread: res.thread, posts: res.posts.map((p) => toPostDTO(p, token, Date.now())) },
  });
}
```

## `POST /api/threads/[id]/posts`
Reply. Same spine as thread create; bumps thread unless `sage`. Rejects if thread `isLocked`.

```ts
if (!rateLimit(`${ipHash}:post`, config.rl.postPerMin, 60_000))
  throw new HttpError(429, "RATE_LIMITED", "Too many posts.");
const input = CreateReplySchema.parse(fields);
if (thread.isLocked) throw new HttpError(423, "LOCKED", "Thread locked.");
const post = createReply(id, { input, name, tripcode, image: stored, posterToken: token, ipHash });
return Response.json({ data: toPostDTO(post, token, Date.now()) }, { status: 201 });
```

## `DELETE /api/posts/[id]`
Dual-path: **self-delete** (token + 180-min window) OR **admin delete**.

```ts
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (session?.role === "admin") {
      softDeletePost(id, "admin");
      return Response.json({ data: { ok: true } });
    }
    const token = await getPosterToken();
    if (!token) throw new HttpError(403, "FORBIDDEN", "Not your post.");
    if (!canSelfDelete(id, token, Date.now()))
      throw new HttpError(403, "WINDOW_CLOSED", "Can't delete this anymore.");
    softDeletePost(id, "self");
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`canSelfDelete`: post exists, `posterToken` matches, not already deleted, `now - createdAt <= SELF_DELETE_WINDOW_MS`.

## `POST /api/posts/[id]/report`
Anyone can flag. Rate-limited per ipHash to prevent report spam. Inserts into `reports`.

## `POST /api/auth/handle`
Claim or log into an optional handle.

```ts
const { handle, password } = HandleAuthSchema.parse(await req.json());
const existing = getUserByHandle(handle);
if (existing) {
  if (!(await bcrypt.compare(password, existing.passwordHash)))
    throw new HttpError(401, "BAD_CREDS", "Wrong password.");
  await createSession({ userId: existing.id, handle, role: existing.role });
} else {
  const user = createUser(handle, await bcrypt.hash(password, 12)); // role "user"
  await createSession({ userId: user.id, handle, role: "user" });
}
return Response.json({ data: { handle } });
```

## `POST /api/auth/admin`
Same as handle login but **only** succeeds for `role = "admin"`. Returns 403 otherwise. Apply a stricter rate limit (e.g. 5 / 15 min per ipHash) to resist brute force.

## `GET /api/admin/reports` and admin mutations
Guard every admin route with `await requireAdmin()` at the top. Endpoints: list/resolve reports, pin/lock/archive/delete threads, create/edit boards, add/remove bans. All return typed JSON; all log the acting admin.

## Middleware note
Add `middleware.ts` to protect `/admin/*` pages (redirect to `/admin/login` if no admin session) — but **never** rely on middleware for API authorization; each API route re-checks `requireAdmin()`.

## Exit criteria
- Each route validates input, rate-limits, and never leaks `ipHash`/`posterToken`.
- A locked thread rejects replies (423); an archived thread 404s on new posts.
- Self-delete works inside 180 min, 403s after.
