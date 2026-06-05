import { describe, it, expect } from "vitest";
import { toPostDTO } from "@/lib/db/dto";
import type { Post } from "@/lib/db/schema";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "post1",
    threadId: "thread1",
    boardId: "gen",
    isOp: false,
    authorHandle: null,
    tripcode: null,
    body: "test body",
    imagePath: null,
    thumbPath: null,
    posterToken: "tok-abc",
    ipHash: "hashed-ip-secret",
    createdAt: 1_000_000,
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

describe("toPostDTO", () => {
  it("strips ipHash and posterToken from output", () => {
    const dto = toPostDTO(makePost(), null);
    expect(dto).not.toHaveProperty("ipHash");
    expect(dto).not.toHaveProperty("posterToken");
  });

  it("ownPost = true when token matches", () => {
    const dto = toPostDTO(makePost({ posterToken: "tok-abc" }), "tok-abc", 1_000_500);
    expect(dto.ownPost).toBe(true);
  });

  it("ownPost = false when token differs", () => {
    const dto = toPostDTO(makePost({ posterToken: "tok-abc" }), "tok-xyz", 1_000_500);
    expect(dto.ownPost).toBe(false);
  });

  it("canDeleteUntil is set when own post within window", () => {
    const now = 1_000_500;
    const createdAt = now - 60_000; // 1 min ago, well within 180min
    const dto = toPostDTO(makePost({ posterToken: "t", createdAt }), "t", now);
    expect(dto.canDeleteUntil).not.toBeNull();
    expect(dto.canDeleteUntil).toBeGreaterThan(now);
  });

  it("canDeleteUntil is null when window has passed", () => {
    const now = 1_000_000 + 181 * 60 * 1000; // 181 min later
    const dto = toPostDTO(makePost({ posterToken: "t", createdAt: 1_000_000 }), "t", now);
    expect(dto.canDeleteUntil).toBeNull();
  });

  it("canDeleteUntil is null for deleted post", () => {
    const post = makePost({ posterToken: "t", createdAt: 1_000, deletedAt: 2_000 });
    const dto = toPostDTO(post, "t", 1_500);
    expect(dto.canDeleteUntil).toBeNull();
  });

  it("deleted post has empty body and no image paths", () => {
    const post = makePost({
      deletedAt: 999,
      body: "secret",
      imagePath: "/uploads/x.webp",
      thumbPath: "/uploads/x-t.webp",
    });
    const dto = toPostDTO(post, null, 1000);
    expect(dto.body).toBe("");
    expect(dto.imagePath).toBeNull();
    expect(dto.thumbPath).toBeNull();
    expect(dto.deleted).toBe(true);
  });

  it("Anonymous name when authorHandle is null", () => {
    const dto = toPostDTO(makePost({ authorHandle: null }), null);
    expect(dto.name).toBe("Anonymous");
  });
});
