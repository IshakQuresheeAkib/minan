import { z } from "zod";

const opaqueCursor = z.string().regex(/^[A-Za-z0-9_-]{16,}$/);

export const publicOrderSearchSchema = z.object({
  query: z.string().trim().min(1).max(64),
  cursor: opaqueCursor.optional(),
  limit: z.number().int().min(1).max(20).default(10),
}).strict();

export const customerOrderListQuerySchema = z.object({
  cursor: opaqueCursor.optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
}).strict();
