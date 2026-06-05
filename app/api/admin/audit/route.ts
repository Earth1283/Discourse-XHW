import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http";
import { listAuditLog } from "@/lib/db/services/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ data: listAuditLog(200) });
  } catch (e) {
    return errorResponse(e);
  }
}
