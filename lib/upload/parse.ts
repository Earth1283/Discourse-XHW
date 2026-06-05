import "server-only";
import { config } from "@/lib/config";
import { HttpError } from "@/lib/http";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function parseMultipart(req: Request): Promise<{
  fields: Record<string, unknown>;
  image: { buffer: Buffer; mime: string } | null;
}> {
  const form = await req.formData();
  const fields: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string") fields[k] = coerce(k, v);
  }

  const file = form.get("image");
  let image: { buffer: Buffer; mime: string } | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > config.maxUploadBytes) {
      throw new HttpError(413, "TOO_BIG", `Image too large (max ${config.maxUploadBytes / 1024 / 1024} MB).`);
    }
    if (!ALLOWED.has(file.type)) {
      throw new HttpError(415, "BAD_TYPE", "Unsupported image type (JPEG, PNG, GIF, WebP only).");
    }
    image = { buffer: Buffer.from(await file.arrayBuffer()), mime: file.type };
  }
  return { fields, image };
}

function coerce(key: string, v: string): unknown {
  if (key === "sage") return v === "true" || v === "on";
  return v;
}
