import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  await destroySession();
  return Response.json({ data: { ok: true } });
}
