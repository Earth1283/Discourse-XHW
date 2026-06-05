import { errorResponse, HttpError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/guards";
import { clientIp, hashIp } from "@/lib/auth/iphash";
import { rateLimit } from "@/lib/ratelimit";
import { createSession } from "@/lib/auth/session";
import { verifyAdmin } from "@/lib/db/services/users";
import { HandleAuthSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ipHash = hashIp(clientIp(req));
    if (!rateLimit(`${ipHash}:adminlogin`, 5, 15 * 60_000)) {
      throw new HttpError(429, "RATE_LIMITED", "Too many login attempts.");
    }
    const input = HandleAuthSchema.parse(await req.json());
    const user = await verifyAdmin(input.handle, input.password);
    await createSession({ userId: user.id, handle: user.handle, role: "admin" });
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
