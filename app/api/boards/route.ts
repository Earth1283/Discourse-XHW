import { listBoards } from "@/lib/db/services/boards";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ data: listBoards() });
  } catch (e) {
    return errorResponse(e);
  }
}
