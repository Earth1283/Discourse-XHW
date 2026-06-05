// Client-safe DTO types. No server-only imports here — both client and server
// components import these.

export type BoardDTO = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  adminOnlyPost: boolean;
  liveThreads: number;
};

export type ThreadCard = {
  id: string;
  boardId: string;
  title: string | null;
  excerpt: string;
  thumbPath: string | null;
  replyCount: number;
  bumpedAt: number;
  isPinned: boolean;
  isLocked: boolean;
};

export type ThreadMeta = {
  id: string;
  boardId: string;
  title: string | null;
  isLocked: boolean;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: number;
  bumpedAt: number;
  replyCount: number;
};

export type PostDTO = {
  id: string;
  threadId: string;
  boardId: string;
  isOp: boolean;
  name: string; // resolved display name or "Anonymous"
  tripcode: string | null;
  body: string; // raw; rendered client-side
  imagePath: string | null;
  thumbPath: string | null;
  createdAt: number;
  deleted: boolean;
  ownPost: boolean;
  canDeleteUntil: number | null;
  pending?: boolean; // optimistic-only: true while mutation is in-flight
};

export type ThreadData = {
  thread: ThreadMeta;
  posts: PostDTO[];
};
