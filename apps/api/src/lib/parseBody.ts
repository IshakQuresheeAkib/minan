import type { ZodType } from "zod";

import { AppError } from "./errors.js";

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new AppError(message, 400);
  }

  return result.data;
}
