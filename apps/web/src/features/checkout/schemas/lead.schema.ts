import { z } from "zod";

const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

export const leadInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone_number: z.string().trim().regex(bdPhoneRegex, "Enter a valid Bangladesh phone number."),
  email: z.email("Enter a valid email address."),
  address: z.string().trim().min(8).max(400),
  notes: z.string().trim().max(500).optional(),
  bkash_txn_id: z.string().trim().max(80).optional(),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
