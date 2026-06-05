import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { getThread, setThreadMeta } from "@/lib/db/services/threads";
import { logAdminAction } from "@/lib/db/services/audit";
import type { AuditAction } from "@/lib/db/services/audit";

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
    const session = await requireAdmin();
    const { id } = await params;
    if (!getThread(id)) throw new HttpError(404, "NO_THREAD", "Thread not found.");
    const patch = PatchSchema.parse(await req.json());
    setThreadMeta(id, patch);

    // Log the most specific action taken
    const actionMap: [keyof typeof patch, AuditAction, AuditAction][] = [
      ["isLocked", "lock_thread", "unlock_thread"],
      ["isPinned", "pin_thread", "unpin_thread"],
    ];
    for (const [key, trueAction, falseAction] of actionMap) {
      if (patch[key] !== undefined) {
        logAdminAction({ adminHandle: session.handle, action: patch[key] ? trueAction : falseAction, targetType: "thread", targetId: id });
      }
    }
    if (patch.isArchived) {
      logAdminAction({ adminHandle: session.handle, action: "archive_thread", targetType: "thread", targetId: id });
    }

    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
