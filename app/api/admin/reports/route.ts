import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { listOpenReports } from "@/lib/db/services/reports";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ data: listOpenReports() });
  } catch (e) {
    return errorResponse(e);
  }
}
