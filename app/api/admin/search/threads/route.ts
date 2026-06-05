import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http";
import { searchThreads } from "@/lib/db/services/search";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
    return Response.json({ data: searchThreads(q) });
  } catch (e) {
    return errorResponse(e);
  }
}
