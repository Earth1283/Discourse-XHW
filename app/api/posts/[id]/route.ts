import { errorResponse, HttpError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/guards";
import { getPosterToken } from "@/lib/auth/tokens";
import { getSession } from "@/lib/auth/session";
import { canSelfDelete, getPost, softDeletePost } from "@/lib/db/services/posts";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const { id } = await params;

    if (!getPost(id)) throw new HttpError(404, "NO_POST", "Post not found.");

    // Admin path: can delete anything.
    const session = await getSession();
    if (session?.role === "admin") {
      softDeletePost(id, "admin");
      return Response.json({ data: { ok: true } });
    }

    // Self path: own post, within the 180-minute window.
    const token = await getPosterToken();
    if (!canSelfDelete(id, token, Date.now())) {
      throw new HttpError(403, "WINDOW_CLOSED", "You can't delete this post.");
    }
    softDeletePost(id, "self");
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
