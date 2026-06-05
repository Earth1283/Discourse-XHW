import { config } from "@/lib/config";
import { errorResponse, HttpError } from "@/lib/http";
import { assertNotBanned, assertSameOrigin } from "@/lib/guards";
import { clientIp, hashIp } from "@/lib/auth/iphash";
import { getOrCreatePosterToken } from "@/lib/auth/tokens";
import { parseName } from "@/lib/auth/tripcode";
import { rateLimit } from "@/lib/ratelimit";
import { assertNotDupe } from "@/lib/ratelimit/dupeguard";
import { CreateReplySchema } from "@/lib/validation/schemas";
import { getThread } from "@/lib/db/services/threads";
import { createReply } from "@/lib/db/services/posts";
import { toPostDTO } from "@/lib/db/dto";
import { parseMultipart } from "@/lib/upload/parse";
import { processAndStore } from "@/lib/upload/process";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const { id } = await params;

    const thread = getThread(id);
    if (!thread || thread.isArchived) throw new HttpError(404, "NO_THREAD", "Thread not found.");
    if (thread.isLocked) throw new HttpError(423, "LOCKED", "Thread is locked.");

    const ipHash = hashIp(clientIp(req));
    assertNotBanned(ipHash);
    if (!rateLimit(`${ipHash}:post`, config.rl.postPerMin, 60_000)) {
      throw new HttpError(429, "RATE_LIMITED", "Too many posts — slow down.");
    }

    const { fields, image } = await parseMultipart(req);

    if (image) {
      if (!rateLimit(`${ipHash}:upload`, config.rl.uploadPerMin, 60_000)) {
        throw new HttpError(429, "RATE_LIMITED", "Too many uploads — slow down.");
      }
    }

    const token = await getOrCreatePosterToken();
    const input = CreateReplySchema.parse(fields);
    assertNotDupe(token, input.body);
    const { name, tripcode } = parseName(input.name);

    const imageResult = image ? await processAndStore(image) : null;

    const post = createReply({
      threadId: id,
      boardId: thread.boardId,
      body: input.body,
      name,
      tripcode,
      posterToken: token,
      ipHash,
      sage: input.sage,
      imagePath: imageResult?.imagePath,
      thumbPath: imageResult?.thumbPath,
    });

    return Response.json({ data: toPostDTO(post, token) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
