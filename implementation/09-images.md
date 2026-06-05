# 09 — Image Upload Pipeline

Every uploaded image is **re-encoded** server-side. We never trust or store the original bytes as-is — this strips EXIF/GPS metadata, normalizes format, and neutralizes polyglot/malicious files.

> **Compression: lossless.** Full images are stored as **lossless WebP** (`{ lossless: true }`) so re-encoding does not degrade quality — the only pixel change is the resize-to-fit cap. (Lossless re-encoding of an already-lossy JPEG won't *recover* detail, but it adds no further generation loss.) Thumbnails use `nearLossless` to stay small while keeping the catalog crisp. Posting with **no image is fully supported** — image is always optional on both threads and replies.

## 1. Multipart parsing — `lib/upload/parse.ts`

Next.js Route Handlers accept `FormData` natively:

```ts
import "server-only";
import { config } from "@/lib/config";
import { HttpError } from "@/lib/http";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function parseMultipart(req: Request) {
  const form = await req.formData();
  const fields: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") fields[k] = coerce(k, v);

  const file = form.get("image");
  let image: { buffer: Buffer; mime: string } | null = null;
  if (file && file instanceof File && file.size > 0) {
    if (file.size > config.maxUploadBytes) throw new HttpError(413, "TOO_BIG", "Image too large.");
    if (!ALLOWED.has(file.type)) throw new HttpError(415, "BAD_TYPE", "Unsupported image type.");
    image = { buffer: Buffer.from(await file.arrayBuffer()), mime: file.type };
  }
  return { fields, image };
}

function coerce(key: string, v: string) {
  if (key === "sage") return v === "true" || v === "on";
  return v;
}
```

## 2. Validate + re-encode + thumbnail — `lib/upload/process.ts`

```ts
import "server-only";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { config } from "@/lib/config";
import { HttpError } from "@/lib/http";

export async function processAndStore(
  image: { buffer: Buffer; mime: string },
  ipHash: string,
): Promise<{ imagePath: string; thumbPath: string; width: number; height: number }> {
  // sharp inspects real bytes — rejects files that lie about their type
  let meta;
  try {
    meta = await sharp(image.buffer, { animated: true }).metadata();
  } catch {
    throw new HttpError(415, "BAD_IMAGE", "Not a valid image.");
  }
  if (!meta.format) throw new HttpError(415, "BAD_IMAGE", "Unknown format.");

  const isAnimated = (meta.pages ?? 1) > 1;        // animated gif/webp
  const id = nanoid(16);
  const subdir = id.slice(0, 2);                   // shard to avoid huge dirs
  const dir = path.join(config.uploadDir, subdir);
  await fs.mkdir(dir, { recursive: true });

  // FULL: re-encode LOSSLESS. Animated -> keep webp animation; else webp still.
  const fullName = `${id}.webp`;
  const fullPipe = sharp(image.buffer, { animated: isAnimated })
    .rotate()                                       // bake in orientation, drop EXIF
    .resize({ width: config.maxImageDim, height: config.maxImageDim, fit: "inside", withoutEnlargement: true })
    .webp({ lossless: true, effort: 4 });           // lossless: no generation loss on re-encode
  const full = await fullPipe.toBuffer({ resolveWithObject: true });
  await fs.writeFile(path.join(dir, fullName), full.data);

  // THUMB: static, small, square-ish cover. near-lossless keeps it crisp but small.
  const thumbName = `${id}_t.webp`;
  await sharp(image.buffer)                          // first frame only
    .rotate()
    .resize({ width: 360, height: 360, fit: "cover" })
    .webp({ nearLossless: true, quality: 90 })
    .toFile(path.join(dir, thumbName));

  return {
    imagePath: `/uploads/${subdir}/${fullName}`,
    thumbPath: `/uploads/${subdir}/${thumbName}`,
    width: full.info.width,
    height: full.info.height,
  };
}
```

Key safety properties:
- **EXIF/GPS stripped** — `sharp` does not copy metadata by default; `.rotate()` bakes orientation then discards it.
- **Format laundering** — output is always re-encoded WebP; a renamed `.exe` or HTML-polyglot fails `sharp().metadata()`.
- **Bomb protection** — `resize(..withoutEnlargement)` + `maxUploadBytes` size cap; sharp also guards pixel limits (`limitInputPixels` default on).
- **Lossless output size** — lossless WebP of a photo can be *larger* than a lossy source. `maxUploadBytes` caps the **input**; the resize-to-`maxImageDim` cap bounds output pixels, but disk usage per image is higher than lossy. Budget storage accordingly, or add an optional `MAX_OUTPUT_BYTES` guard that falls back to high-quality lossy if a lossless encode exceeds it.

## 3. Serving uploads
- v1: write to `config.uploadDir` (`./uploads`), served at `/uploads/**`.
  - In Next.js, either (a) put `uploads` under `public/` won't work for runtime writes, so (b) add a lightweight static route handler `app/uploads/[...path]/route.ts` that streams files from disk with correct `Content-Type` + long cache headers, OR (c) front it with nginx/Caddy serving the directory directly (preferred in prod).
- Set `Cache-Control: public, max-age=31536000, immutable` (filenames are content-unique).

```ts
// app/uploads/[...path]/route.ts (dev/simple-prod)
export const runtime = "nodejs";
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const safe = parts.filter((p) => p !== ".." && !p.includes("/"));   // path traversal guard
  const file = path.join(config.uploadDir, ...safe);
  const data = await fs.readFile(file);          // 404 on ENOENT
  return new Response(data, {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
```

## 4. Storage abstraction — `lib/storage/index.ts`
Wrap read/write behind an interface so moving to S3-compatible storage later is a drop-in:

```ts
export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  url(key: string): string;
  delete(key: string): Promise<void>;
}
export const storage: Storage = new DiskStorage(config.uploadDir); // swap for S3Storage later
```

`processAndStore` should call `storage.put` rather than `fs.writeFile` directly once the abstraction exists.

## 5. Deletion & images
Soft-deleting a post leaves files in place (cheap, reversible). A periodic `purgeOrphans` job (or admin "hard purge") deletes files for posts deleted > 30 days ago.

## 6. NSFW posture
Per "bare minimum" decision, no automated NSFW classification in v1. Spoiler-image support exists so users can self-mark. Hook point left for later: run thumbnails through an NSFW model in `processAndStore` and set a `nsfw` flag → blur by default.

## Exit criteria
- Uploading a JPEG with GPS EXIF stores a WebP with **no** metadata (verify with `exiftool`).
- A renamed non-image is rejected with 415.
- Thumbnails render in the catalog; full image opens in thread.
- Optimistic local-preview swaps to server thumb on success.
