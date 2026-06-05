import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getThreadWithPosts } from "@/lib/db/services/threads";
import { toPostDTO } from "@/lib/db/dto";
import { getPosterToken } from "@/lib/auth/tokens";
import { qk } from "@/lib/query/keys";
import { ThreadView } from "@/components/thread/ThreadView";
import type { ThreadData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ board: string; thread: string }>;
}) {
  const { board, thread: threadId } = await params;
  const res = getThreadWithPosts(threadId);
  if (!res) notFound();

  const token = await getPosterToken();
  const data: ThreadData = {
    thread: res.thread,
    posts: res.posts.map((p) => toPostDTO(p, token)),
  };

  const qc = new QueryClient();
  qc.setQueryData(qk.thread(threadId), data);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ThreadView board={board} threadId={threadId} />
    </HydrationBoundary>
  );
}
