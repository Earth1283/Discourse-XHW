import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) {
    return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  }
  if (e instanceof ZodError) {
    const first = e.issues[0];
    return Response.json(
      { error: { code: "VALIDATION", message: first?.message ?? "Invalid input." } },
      { status: 400 },
    );
  }
  console.error(e);
  return Response.json(
    { error: { code: "INTERNAL", message: "Something broke." } },
    { status: 500 },
  );
}
