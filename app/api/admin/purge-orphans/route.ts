import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http";
import { assertSameOrigin } from "@/lib/guards";
import { purgeOrphanImages } from "@/lib/db/services/purge";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const count = await purgeOrphanImages();
    return Response.json({ data: { purged: count } });
  } catch (e) {
    return errorResponse(e);
  }
}
