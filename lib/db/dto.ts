import "server-only";
import { config } from "@/lib/config";
import type { Post } from "./schema";
import type { PostDTO } from "@/lib/types";

/**
 * Map a DB post row to a client-safe DTO.
 * Strips ipHash + posterToken; computes ownPost + self-delete deadline.
 */
export function toPostDTO(post: Post, posterToken: string | null, now: number = Date.now()): PostDTO {
  const ownPost = posterToken != null && post.posterToken === posterToken;
  const deleted = post.deletedAt != null;
  const canDeleteUntil =
    ownPost && !deleted ? post.createdAt + config.selfDeleteWindowMs : null;

  return {
    id: post.id,
    threadId: post.threadId,
    boardId: post.boardId,
    isOp: post.isOp,
    name: post.authorHandle ?? "Anonymous",
    tripcode: post.tripcode,
    body: deleted ? "" : post.body,
    imagePath: deleted ? null : post.imagePath,
    thumbPath: deleted ? null : post.thumbPath,
    createdAt: post.createdAt,
    deleted,
    ownPost,
    canDeleteUntil: canDeleteUntil != null && canDeleteUntil > now ? canDeleteUntil : null,
  };
}
