import { z } from "zod";

import { paymentMethods } from "../config/checkoutPayment.js";
import { shippingZones } from "../config/shipping.js";
import { leadCreateSchema } from "./lead.schemas.js";

export const paymentCreateSchema = leadCreateSchema.extend({
  checkout_source: z.enum(["cart", "buy_now"]),
  shipping_zone: z.enum(shippingZones, {
    error: "Select a valid shipping method.",
  }).optional(),
  payment_method: z.enum(paymentMethods).default("cod"),
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
