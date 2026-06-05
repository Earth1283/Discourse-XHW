import { errorResponse, HttpError } from "@/lib/http";
import { getPosterToken } from "@/lib/auth/tokens";
import { getThreadWithPosts } from "@/lib/db/services/threads";
import { toPostDTO } from "@/lib/db/dto";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = getThreadWithPosts(id);
    if (!res) throw new HttpError(404, "NO_THREAD", "Thread not found.");
    const token = await getPosterToken();
    const now = Date.now();
    return Response.json({
      data: {
        thread: res.thread,
        posts: res.posts.map((p) => toPostDTO(p, token, now)),
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
