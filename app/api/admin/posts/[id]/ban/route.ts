import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { getPost } from "@/lib/db/services/posts";
import { createBan } from "@/lib/db/services/bans";
import { logAdminAction } from "@/lib/db/services/audit";

export const runtime = "nodejs";

const BanSchema = z.object({
  reason: z.string().max(300).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const post = getPost(id);
    if (!post) throw new HttpError(404, "NO_POST", "Post not found.");
    const input = BanSchema.parse(await req.json().catch(() => ({})));
    createBan(post.ipHash, input.reason);
    logAdminAction({ adminHandle: session.handle, action: "ban_poster", targetType: "ban", targetId: id, detail: input.reason });
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
