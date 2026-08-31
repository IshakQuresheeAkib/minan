import { z } from "zod";

const orderNumber = z.string().trim().min(1).max(64);
const email = z.string().trim().email().max(320);

export const guestOrderOtpRequestSchema = z.object({
  order_number: orderNumber,
  email,
}).strict();

export const guestOrderOtpVerificationSchema = guestOrderOtpRequestSchema.extend({
  otp: z.string().regex(/^\d{6}$/),
}).strict();

export const guestOrderPathParamsSchema = z.object({
  orderNumber,
}).strict();
