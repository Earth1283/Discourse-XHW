import { errorResponse } from "@/lib/http";
import { searchPosts } from "@/lib/db/services/search";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const board = url.searchParams.get("board") ?? undefined;
    const results = searchPosts(q, board);
    return Response.json({ data: results });
  } catch (e) {
    return errorResponse(e);
  }
}
