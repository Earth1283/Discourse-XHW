# 06 — Frontend Pages & Components

Page tree (App Router). Server Components fetch initial data; Client Components handle interaction + optimistic mutations.

## `app/(site)/layout.tsx`
Wraps children in `<Providers>` (React Query), renders `<TopBar />`, and mounts `<RulesGate />` (see `10-moderation-safety.md`). Sets `<html data-theme>` from a cookie/localStorage hydration script to avoid theme flash.

## Board index — `app/(site)/page.tsx` (Server Component)
- Fetches `listBoards()` directly (server) — no client round-trip on first paint.
- Renders a clean grid of board cards: code pill, name, description, live thread count.
- Each card links to `/b/[board]`.

```tsx
export default async function Home() {
  const boards = listBoards();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-mono text-lg lowercase text-[var(--color-muted)] mb-6">ssbs // boards</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((b) => <BoardCard key={b.id} board={b} />)}
      </div>
    </main>
  );
}
```

## Board catalog — `app/(site)/b/[board]/page.tsx`
- Server-fetch first page of thread cards; hydrate a Client `<Catalog>` that uses `useInfiniteQuery` for pagination.
- Responsive masonry-ish grid of `<ThreadCard>`: thumbnail (or text-only), OP excerpt (rendered, clamped), reply count, last-bump relative time, pinned/locked badges.
- Sort: pinned first, then `bumpedAt` desc.
- Floating "New thread" FAB on mobile; inline composer toggle on desktop.

```tsx
// components/board/ThreadCard.tsx (Client)
<Link href={`/b/${board}/${t.id}`}
  className="group block rounded-[var(--radius)] border border-[var(--color-border)]
             bg-[var(--color-surface)] p-3 transition-colors hover:border-[var(--color-accent)]/50">
  {t.thumbPath && <img src={t.thumbPath} alt="" className="mb-2 h-32 w-full rounded object-cover" />}
  {t.title && <div className="font-medium leading-tight">{t.title}</div>}
  <p className="mt-1 line-clamp-4 text-sm text-[var(--color-muted)]">{t.excerpt}</p>
  <div className="mt-2 flex items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
    {t.isPinned && <Pin size={12} />}{t.isLocked && <Lock size={12} />}
    <span>{t.replyCount} replies</span><span>·</span><RelTime ts={t.bumpedAt} />
  </div>
</Link>
```

## Thread view — `app/(site)/b/[board]/[thread]/page.tsx`
- Server-fetch `getThreadWithPosts`; pass to Client `<ThreadView>`.
- OP rendered prominently (larger image, distinct surface). Replies stack below.
- `<Post>` renders body via `renderBody()` segments:
  - greentext → accent-green line
  - `>>postId` → quote-link; hovering shows a floating preview of the target post; clicking scrolls + highlights it
  - URLs → links (`rel="noopener noreferrer"`, `target="_blank"`)
  - spoilers → blurred until click
- Each post shows delete (trash) icon only if `ownPost && now < canDeleteUntil` (or admin). Countdown tooltip: "deletable for 2h 58m".
- Sticky bottom `<ReplyComposer>` (collapses to a bar; expands on focus). Clicking a `#postId` inserts `>>id\n` quote.

```tsx
// components/thread/Post.tsx
export function Post({ post }: { post: PostDTO }) {
  if (post.deleted) return <DeletedStub id={post.id} />;
  const lines = renderBody(post.body);
  return (
    <article id={`p-${post.id}`} className="scroll-mt-20 rounded-[var(--radius)] bg-[var(--color-surface)] p-3">
      <PostMeta post={post} />
      <div className="mt-1.5 whitespace-pre-wrap leading-relaxed text-[15px]">
        {post.imagePath && <PostImage post={post} />}
        {lines.map((segs, i) => <Line key={i} segs={segs} />)}
      </div>
    </article>
  );
}
```

## Composer — `components/thread/ReplyComposer.tsx` & `ThreadComposer`
- Auto-growing `<TextArea>`, optional name field (`name#trip`), optional image picker with local preview, sage checkbox.
- Client-side `CreateReplySchema.safeParse` for instant feedback; server re-validates.
- Submits via the optimistic mutation in `07-optimistic-ui.md`.
- Drag-and-drop + paste image support. Shows selected file name + size + "strips location data on upload" reassurance.
- Disabled until rules accepted (gate covers this globally, but composer also guards).

## `app/(site)/rules/page.tsx`
Full rules text (single source of truth — the gate modal imports the same content). Plain, readable, mono headers.

## Utility components
- `<RelTime ts>` — `2m`, `3h`, `Apr 2`; updates on an interval; `title` = absolute time.
- `<QuotePreview postId>` — fetches/looks up cached post, renders floating card on hover (desktop) / long-press (mobile).
- `<EmptyState>` — for empty boards ("No threads. Start the fire.").

## `app/admin/*`
- `/admin/login` — handle + password form → `POST /api/auth/admin`.
- `/admin` — tabbed console: Reports queue, Threads (pin/lock/archive/delete), Boards (CRUD + reorder), Bans. Each action is a React Query mutation hitting admin APIs. Plain, dense, table-driven UI (admin can be utilitarian — it doesn't need the public polish).

## Loading & error UX
- Use `loading.tsx` + Suspense skeletons (hairline shimmer, not spinners) for board/thread routes.
- `error.tsx` boundaries render a calm retry card.
- Network mutation failures → `<Toast variant="danger">` + optimistic rollback.

## Exit criteria
- Board → catalog → thread → reply flow works end-to-end with real data.
- Quote-link hover preview + click-to-scroll works.
- Delete icon appears/disappears correctly based on ownership + window.
