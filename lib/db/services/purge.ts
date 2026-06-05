import "server-only";
import { and, inArray, isNotNull, lt, or } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
import { db } from "../client";
import { posts } from "../schema";
import { config } from "@/lib/config";

/**
 * Delete image files for posts soft-deleted more than `olderThanMs` ago.
 * Nulls out imagePath + thumbPath in DB after removal.
 * Returns count of posts cleaned.
 */
export async function purgeOrphanImages(
  olderThanMs = 30 * 24 * 60 * 60 * 1000,
): Promise<number> {
  const cutoff = Date.now() - olderThanMs;

  const rows = db
    .select({ id: posts.id, imagePath: posts.imagePath, thumbPath: posts.thumbPath })
    .from(posts)
    .where(
      and(
        isNotNull(posts.deletedAt),
        lt(posts.deletedAt, cutoff),
        or(isNotNull(posts.imagePath), isNotNull(posts.thumbPath)),
      ),
    )
    .all();

  if (rows.length === 0) return 0;

  for (const row of rows) {
    for (const relPath of [row.imagePath, row.thumbPath]) {
      if (!relPath) continue;
      const abs = path.join(config.uploadDir, relPath.replace(/^\/uploads\//, ""));
      await fs.unlink(abs).catch(() => {});
    }
  }

  db.update(posts)
    .set({ imagePath: null, thumbPath: null })
    .where(inArray(posts.id, rows.map((r) => r.id)))
    .run();

  return rows.length;
}
