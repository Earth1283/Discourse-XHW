import { z } from "zod";

export const BodySchema = z.string().trim().min(1, "Say something.").max(8000, "Too long.");

export const TitleSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => (v ? v : undefined));

// "name#secret" -> name + tripcode; bare name allowed; blank => Anonymous
export const NameFieldSchema = z.string().trim().max(50).optional();

export const CreateThreadSchema = z.object({
  title: TitleSchema,
  body: BodySchema,
  name: NameFieldSchema,
  sage: z.boolean().optional().default(false),
});

export const CreateReplySchema = z.object({
  body: BodySchema,
  name: NameFieldSchema,
  sage: z.boolean().optional().default(false),
});

export const ReportSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export const HandleAuthSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscore."),
  password: z.string().min(8).max(200),
});

export const CreateBoardSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .regex(/^[a-z0-9]+$/, "Lowercase letters and numbers only."),
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(200).optional().default(""),
  sortOrder: z.coerce.number().int().optional(),
});

export const UpdateBoardSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  description: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().optional(),
  adminOnlyPost: z.boolean().optional(),
});

export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;
export type CreateReplyInput = z.infer<typeof CreateReplySchema>;
