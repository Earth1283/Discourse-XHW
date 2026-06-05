import { errorResponse, HttpError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/guards";
import { clientIp, hashIp } from "@/lib/auth/iphash";
import { rateLimit } from "@/lib/ratelimit";
import { getPost } from "@/lib/db/services/posts";
import { createReport } from "@/lib/db/services/reports";
import { ReportSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const { id } = await params;
    if (!getPost(id)) throw new HttpError(404, "NO_POST", "Post not found.");

    const ipHash = hashIp(clientIp(req));
    if (!rateLimit(`${ipHash}:report`, 10, 10 * 60_000)) {
      throw new HttpError(429, "RATE_LIMITED", "Too many reports — slow down.");
    }

    const input = ReportSchema.parse(await req.json());
    createReport(id, input.reason);
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
