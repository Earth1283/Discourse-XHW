import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { getThread, setThreadMeta } from "@/lib/db/services/threads";

export const runtime = "nodejs";

const PatchSchema = z.object({
  isLocked: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!getThread(id)) throw new HttpError(404, "NO_THREAD", "Thread not found.");
    const patch = PatchSchema.parse(await req.json());
    setThreadMeta(id, patch);
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
