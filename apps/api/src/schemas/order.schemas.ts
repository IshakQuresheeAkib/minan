import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
const expectedRevision = z.number().int().min(1);
const money = z.number().finite().int().nonnegative();
const reason = z.string().trim().min(3).max(500);
const transitionStatus = z.enum([
  "new", "confirmed", "processing", "shipped", "delivered",
  "on_hold", "cancelled",
]);

export const orderListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.string().max(200).optional(),
  payment_status: z.string().max(200).optional(),
  cod_status: z.string().max(200).optional(),
  date_from: z.iso.date().optional(),
  date_to: z.iso.date().optional(),
  duplicate_only: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "oldest", "order_number"]).default("newest"),
});

export const orderCustomerUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone_number: z
    .string()
    .trim()
    .regex(bdPhoneRegex, "Enter a valid Bangladesh phone number.")
    .optional(),
  email: z.email().max(254).optional(),
  address: z.string().trim().min(5).max(1000).optional(),
  expected_revision: expectedRevision,
  reason,
}).refine((value) => value.name !== undefined || value.phone_number !== undefined ||
  value.email !== undefined || value.address !== undefined, "At least one customer field is required");

const orderItem = z.object({
  line_id: z.string().uuid().optional(),
  product_id: objectId,
  size: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(100),
});

export const orderItemsUpdateSchema = z.object({
  items: z.array(orderItem).min(1).max(100),
  order_discount: money,
  customer_confirmed: z.literal(true),
  expected_revision: expectedRevision,
  reason,
});

export const orderTransitionSchema = z.object({
  status: transitionStatus,
  expected_revision: expectedRevision,
  reason: z.string().trim().max(500).optional(),
  override_reason: z.string().trim().min(3).max(500).optional(),
});

export const orderCourierUpdateSchema = z.object({
  courier_name: z.string().trim().min(2).max(120),
  tracking_number: z.string().trim().min(2).max(120),
  expected_revision: expectedRevision,
  reason,
});

export const orderCodSchema = z.object({
  amount: money.optional(),
  expected_revision: expectedRevision,
  reason: reason.optional(),
}).strict();

export const orderNoteSchema = z.object({
  note: z.string().trim().min(1).max(500),
  expected_revision: expectedRevision,
});

export const orderDuplicateReviewSchema = z.object({
  state: z.enum(["reviewed_unique", "confirmed_duplicate"]),
  expected_revision: expectedRevision,
  reason,
});

export const orderRefundSchema = z.object({
  amount: money.positive(),
  method: z.enum(["cash", "bkash_manual", "bank_transfer", "other"]),
  reference: z.string().trim().max(120).optional(),
  reason,
  expected_revision: expectedRevision,
});

const returnLine = z.object({
  line_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
});

export const orderReturnSchema = z.object({
  lines: z.array(returnLine).min(1).max(100),
  expected_revision: expectedRevision,
  reason,
});

export const orderExchangeSchema = z.object({
  returned_lines: z.array(returnLine).min(1).max(100),
  replacement_items: z.array(orderItem.omit({ line_id: true })).min(1).max(100),
  expected_revision: expectedRevision,
  reason,
});

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type OrderCustomerUpdateInput = z.infer<typeof orderCustomerUpdateSchema>;
export type OrderItemsUpdateInput = z.infer<typeof orderItemsUpdateSchema>;
export type OrderTransitionInput = z.infer<typeof orderTransitionSchema>;
export type OrderCourierUpdateInput = z.infer<typeof orderCourierUpdateSchema>;
export type OrderCodInput = z.infer<typeof orderCodSchema>;
export type OrderNoteInput = z.infer<typeof orderNoteSchema>;
export type OrderDuplicateReviewInput = z.infer<typeof orderDuplicateReviewSchema>;
export type OrderRefundInput = z.infer<typeof orderRefundSchema>;
export type OrderReturnInput = z.infer<typeof orderReturnSchema>;
export type OrderExchangeInput = z.infer<typeof orderExchangeSchema>;
