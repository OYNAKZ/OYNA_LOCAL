import { z } from "zod";

export const appErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1)
});

export type AppError = z.infer<typeof appErrorSchema>;

export const resultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    z.object({
      ok: z.literal(true),
      data: dataSchema
    }),
    z.object({
      ok: z.literal(false),
      error: appErrorSchema
    })
  ]);

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };
