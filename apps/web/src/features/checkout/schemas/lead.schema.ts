import { z } from "zod";

const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

export const leadInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone_number: z.string().trim().regex(bdPhoneRegex, "Enter a valid Bangladesh phone number."),
  email: z.email("Enter a valid email address."),
  address: z.string().trim().min(8).max(400),
  shipping_zone: z.enum(["inside_sylhet", "outside_sylhet"], {
    error: "Select a shipping method.",
  }).optional(),
  notes: z.string().trim().max(500).optional(),
});

export function getLeadInputSchema(requireShippingZone: boolean) {
  if (!requireShippingZone) return leadInputSchema;
  return leadInputSchema.refine((input) => input.shipping_zone !== undefined, {
    message: "Select a shipping method.",
    path: ["shipping_zone"],
  });
}

export type LeadInput = z.infer<typeof leadInputSchema>;
