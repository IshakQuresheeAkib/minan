import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid product ID")
  .toLowerCase();

export const productQuoteSchema = z.object({
  product_ids: z
    .array(objectIdSchema)
    .min(1, "At least one product is required")
    .max(50, "A maximum of 50 products can be quoted"),
});
