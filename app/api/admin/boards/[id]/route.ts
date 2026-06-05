import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http";
import { updateBoard, deleteBoard } from "@/lib/db/services/boards";
import { UpdateBoardSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const patch = UpdateBoardSchema.parse(body);
    updateBoard(id, patch);
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    deleteBoard(id);
    return Response.json({ data: { ok: true } });
  } catch (e) {
    return errorResponse(e);
  }
}
