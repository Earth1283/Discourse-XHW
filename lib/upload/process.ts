import "server-only";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { config } from "@/lib/config";
import { HttpError } from "@/lib/http";

export async function processAndStore(image: {
  buffer: Buffer;
  mime: string;
}): Promise<{ imagePath: string; thumbPath: string }> {
  // Validate bytes — rejects files that lie about their type / polyglots
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(image.buffer, { animated: true }).metadata();
  } catch {
    throw new HttpError(415, "BAD_IMAGE", "Not a valid image.");
  }
  if (!meta.format) throw new HttpError(415, "BAD_IMAGE", "Unknown image format.");

  const isAnimated = (meta.pages ?? 1) > 1;
  const id = nanoid(16);
  const subdir = id.slice(0, 2);
  const dir = path.join(config.uploadDir, subdir);
  await fs.mkdir(dir, { recursive: true });

  // Full image: lossless WebP — no generation loss on re-encode.
  // .rotate() bakes in EXIF orientation and strips all metadata.
  const fullName = `${id}.webp`;
  const full = await sharp(image.buffer, { animated: isAnimated })
    .rotate()
    .resize({
      width: config.maxImageDim,
      height: config.maxImageDim,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ lossless: true, effort: 4 })
    .toBuffer();
  await fs.writeFile(path.join(dir, fullName), full);

  // Thumbnail: square cover crop, near-lossless for small file size.
  const thumbName = `${id}_t.webp`;
  await sharp(image.buffer)
    .rotate()
    .resize({ width: 360, height: 360, fit: "cover" })
    .webp({ nearLossless: true, quality: 90 })
    .toFile(path.join(dir, thumbName));

  return {
    imagePath: `/uploads/${subdir}/${fullName}`,
    thumbPath: `/uploads/${subdir}/${thumbName}`,
  };
}
