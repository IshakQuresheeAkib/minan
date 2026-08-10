import { z } from "zod";

const deliveryFee = z.number().int().positive().safe();

export const checkoutConfigSchema = z.object({
  delivery_fee: deliveryFee,
  shipping_options: z.tuple([
    z.object({
      id: z.literal("inside_sylhet"),
      label: z.string().trim().min(1),
      delivery_fee: deliveryFee,
    }),
    z.object({
      id: z.literal("outside_sylhet"),
      label: z.string().trim().min(1),
      delivery_fee: deliveryFee,
    }),
  ]).optional(),
  currency: z.literal("BDT"),
  refundable: z.literal(false),
});
