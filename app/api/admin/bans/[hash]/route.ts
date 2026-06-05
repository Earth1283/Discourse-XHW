import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { liftBan } from "@/lib/db/services/bans";
import { logAdminAction } from "@/lib/db/services/audit";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    const session = await requireAdmin();
    const { hash } = await params;
    const decoded = decodeURIComponent(hash);
    liftBan(decoded);
    logAdminAction({ adminHandle: session.handle, action: "lift_ban", targetType: "ban", targetId: decoded.slice(0, 16) });
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
