import { z } from "zod";

const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

const cartSnapshotItemCreateSchema = z.object({
  product_id: z.string().trim().min(1, "Product is required"),
  name: z.string().trim().min(1, "Product name is required"),
  price: z.number().min(0, "Price must be at least 0"),
  size: z.string().trim().min(1, "Size is required"),
  color: z.string().trim().min(1, "Color is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const cartSnapshotCreateSchema = z.object({
  items: z
    .array(cartSnapshotItemCreateSchema)
    .min(1, "Cart must include at least one item"),
  total: z.number().min(0, "Total must be at least 0"),
});

export const leadCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  phone_number: z
    .string()
    .trim()
    .regex(bdPhoneRegex, "Enter a valid Bangladesh phone number."),
  email: z.email("Enter a valid email address"),
  address: z.string().trim().min(8, "Address is required").max(400),
  notes: z.string().trim().max(500).optional(),
  bkash_txn_id: z.string().trim().max(80).optional(),
  cart_snapshot: cartSnapshotCreateSchema,
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
