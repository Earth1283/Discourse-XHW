# 01 — Setup & Scaffold (Phase 0)

Goal: a running Next.js + TS + Tailwind app with the full folder layout, all deps installed, and config in place.

## 1. Create the app

```bash
npx create-next-app@latest ssbs \
  --typescript --tailwind --eslint --app --src-dir=false \
  --import-alias "@/*" --no-turbopack
cd ssbs
```

> If the repo already exists (it does — this is the Discourse-XHW workspace), scaffold into the current directory instead and merge generated files rather than overwriting `plan.md` / `implementation/`.

## 2. Install dependencies

```bash
# data + validation
npm i better-sqlite3 drizzle-orm zod nanoid
npm i -D drizzle-kit @types/better-sqlite3

# auth / crypto
npm i bcryptjs jose
npm i -D @types/bcryptjs

# data fetching (client)
npm i @tanstack/react-query

# images
npm i sharp

# ui
npm i lucide-react clsx tailwind-merge

# testing
npm i -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/dom jsdom
npm i -D @playwright/test
```

## 3. Folder layout

Create these directories (empty placeholders are fine to start):

```
app/
  (site)/
    page.tsx                 # board index
    b/[board]/page.tsx
    b/[board]/[thread]/page.tsx
    rules/page.tsx
    layout.tsx
  admin/
    page.tsx
    login/page.tsx
  api/
    boards/route.ts
    boards/[board]/threads/route.ts
    threads/[id]/route.ts
    threads/[id]/posts/route.ts
    posts/[id]/route.ts
    posts/[id]/report/route.ts
    auth/handle/route.ts
    auth/admin/route.ts
    admin/reports/route.ts
  globals.css
  providers.tsx              # React Query provider
components/
  ui/                        # primitives (Button, Modal, ...)
  board/                     # ThreadCard, Catalog
  thread/                    # Post, ReplyComposer, ThreadView
  layout/                    # TopBar, BoardSwitcher
  RulesGate.tsx
lib/
  db/
    schema.ts
    client.ts
    seed.ts
  storage/index.ts
  validation/schemas.ts
  auth/{session.ts,tripcode.ts,tokens.ts}
  ratelimit/index.ts
  format/render.ts           # greentext / quote-link rendering
  config.ts                  # typed env access
public/
uploads/                     # gitignored
tests/
data/                        # sqlite file lives here (gitignored)
```

## 4. `lib/config.ts` — typed env

```ts
import "server-only";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}
function num(name: string, fallback: number): number {
  const v = process.env[name];
  return v ? Number(v) : fallback;
}

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? "./data/ssbs.db",
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
```

## 5. `.gitignore` additions

```
/data
/uploads
.env.local
```

## 6. `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx lib/db/migrate.ts",
    "db:seed": "tsx lib/db/seed.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```
(Install `tsx` as a dev dep for the node scripts: `npm i -D tsx`.)

## 7. React Query provider — `app/providers.tsx`

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

Wrap in `app/(site)/layout.tsx` (and admin layout) with `<Providers>`.

## Exit criteria
- `npm run dev` serves a blank styled page.
- `lib/config.ts` throws clearly if a required env var is missing.
- Folder skeleton matches the layout above.
