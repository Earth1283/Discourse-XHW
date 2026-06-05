import { config } from "@/lib/config";
import { errorResponse, HttpError } from "@/lib/http";
import { assertNotBanned, assertSameOrigin } from "@/lib/guards";
import { clientIp, hashIp } from "@/lib/auth/iphash";
import { getOrCreatePosterToken } from "@/lib/auth/tokens";
import { parseName } from "@/lib/auth/tripcode";
import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/ratelimit";
import { CreateThreadSchema } from "@/lib/validation/schemas";
import { getBoard } from "@/lib/db/services/boards";
import { createThread, listThreadCards } from "@/lib/db/services/threads";
import { toPostDTO } from "@/lib/db/dto";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ board: string }> }) {
  try {
    const { board } = await params;
    if (!getBoard(board)) throw new HttpError(404, "NO_BOARD", "No such board.");
    const page = Math.max(0, Number(new URL(req.url).searchParams.get("page") ?? 0) || 0);
    return Response.json({ data: listThreadCards(board, page) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ board: string }> }) {
  try {
    assertSameOrigin(req);
    const { board } = await params;

    const brd = getBoard(board);
    if (!brd) throw new HttpError(404, "NO_BOARD", "No such board.");

    if (brd.adminOnlyPost) {
      const session = await getSession();
      if (session?.role !== "admin") throw new HttpError(403, "FORBIDDEN", "Read-only board.");
    }

    const ipHash = hashIp(clientIp(req));
    assertNotBanned(ipHash);
    if (!rateLimit(`${ipHash}:thread`, config.rl.threadPer10Min, 10 * 60_000)) {
      throw new HttpError(429, "RATE_LIMITED", "Slow down — too many new threads.");
    }

    const token = await getOrCreatePosterToken();
    const input = CreateThreadSchema.parse(await req.json());
    const { name, tripcode } = parseName(input.name);

    const { thread, op } = createThread({
      boardId: board,
      title: input.title,
      body: input.body,
      name,
      tripcode,
      posterToken: token,
      ipHash,
    });

    return Response.json(
      { data: { thread, op: toPostDTO(op, token, Date.now()) } },
      { status: 201 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
