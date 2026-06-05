import { requireAdmin } from "@/lib/auth/session";
import { errorResponse, HttpError } from "@/lib/http";
import { getPost, hardDeletePost } from "@/lib/db/services/posts";
import { assertSameOrigin } from "@/lib/guards";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const { id } = await params;
    if (!getPost(id)) throw new HttpError(404, "NO_POST", "Post not found.");
    await hardDeletePost(id);
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
