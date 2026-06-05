import { errorResponse, HttpError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/guards";
import { clientIp, hashIp } from "@/lib/auth/iphash";
import { rateLimit } from "@/lib/ratelimit";
import { createSession } from "@/lib/auth/session";
import { claimOrLogin } from "@/lib/db/services/users";
import { HandleAuthSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ipHash = hashIp(clientIp(req));
    if (!rateLimit(`${ipHash}:auth`, 5, 15 * 60_000)) {
      throw new HttpError(429, "RATE_LIMITED", "Too many attempts — try again later.");
    }
    const input = HandleAuthSchema.parse(await req.json());
    const user = await claimOrLogin(input.handle, input.password);
    await createSession({ userId: user.id, handle: user.handle, role: user.role as "user" | "admin" });
    return Response.json({ data: { handle: user.handle, role: user.role } });
  } catch (e) {
    return errorResponse(e);
  }
}
