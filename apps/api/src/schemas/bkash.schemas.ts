import { z } from "zod";

import { leadCreateSchema } from "./lead.schemas.js";

export const paymentCreateSchema = leadCreateSchema.extend({
  checkout_source: z.enum(["cart", "buy_now"]),
});

export const paymentRetrySchema = z.object({
  retry_token: z.string().min(32).max(200),
});

export const paymentResultResolveSchema = z.object({
  reference: z.string().min(32).max(200),
});

export const bkashCallbackSchema = z.object({
  paymentID: z.string().trim().min(1).max(200),
  status: z.enum(["success", "failure", "cancel"]),
  signature: z.string().trim().min(1).max(1000).optional(),
});

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentRetryInput = z.infer<typeof paymentRetrySchema>;
export type BkashCallbackInput = z.infer<typeof bkashCallbackSchema>;
