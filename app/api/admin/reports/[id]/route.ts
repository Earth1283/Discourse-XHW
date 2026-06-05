import { errorResponse, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { resolveReport } from "@/lib/db/services/reports";
import { getPost, softDeletePost } from "@/lib/db/services/posts";
import { db } from "@/lib/db/client";
import { reports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// PATCH { action: "resolve" | "delete_post" }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const report = db.select().from(reports).where(eq(reports.id, id)).get();
    if (!report) throw new HttpError(404, "NO_REPORT", "Report not found.");

    const body = await req.json().catch(() => ({})) as { action?: string };

    if (body.action === "delete_post") {
      const post = getPost(report.postId);
      if (post && !post.deletedAt) softDeletePost(report.postId, "admin");
    }

    resolveReport(id);
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
