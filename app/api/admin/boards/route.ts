import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http";
import { listBoards, createBoard } from "@/lib/db/services/boards";
import { CreateBoardSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ data: listBoards() });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = CreateBoardSchema.parse(body);
    const board = createBoard(input);
    return Response.json({ data: board }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
