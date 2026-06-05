import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { liftBan } from "@/lib/db/services/bans";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    await requireAdmin();
    const { hash } = await params;
    liftBan(decodeURIComponent(hash));
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
