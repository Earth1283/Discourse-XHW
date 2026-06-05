import { z } from "zod";
import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { listBans, createBan } from "@/lib/db/services/bans";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ data: listBans() });
  } catch (e) {
    return errorResponse(e);
  }
}

const BanSchema = z.object({
  ipHash: z.string().min(1),
  reason: z.string().max(300).optional(),
  expiresAt: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const input = BanSchema.parse(await req.json());
    createBan(input.ipHash, input.reason, input.expiresAt);
    return Response.json({ data: { ok: true } }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
