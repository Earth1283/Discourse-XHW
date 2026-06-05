export const qk = {
  boards: ["boards"] as const,
  threads: (board: string) => ["threads", board] as const,
  thread: (id: string) => ["thread", id] as const,
};
