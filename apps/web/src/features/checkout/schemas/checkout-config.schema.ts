import { z } from "zod";

const deliveryFee = z.number().int().positive().safe();

export const checkoutConfigSchema = z.object({
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
  ]),
  currency: z.literal("BDT"),
  refundable: z.literal(false),
});
