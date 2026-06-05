import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;

  // Path traversal guard: reject any segment that is ".." or contains "/"
  const safe = parts.filter((p) => p !== ".." && !p.includes("/") && p.length > 0);

  const base = path.resolve(config.uploadDir);
  const file = path.resolve(base, ...safe);

  // Belt-and-suspenders: ensure resolved path stays inside uploadDir
  if (!file.startsWith(base + path.sep) && file !== base) {
    return new Response(null, { status: 403 });
  }

  try {
    const data = await fs.readFile(file);
    return new Response(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
