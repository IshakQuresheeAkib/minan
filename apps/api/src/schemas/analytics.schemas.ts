import { z } from "zod";

const utmFields = {
  utm_source: z.string().trim().optional(),
  utm_medium: z.string().trim().optional(),
  utm_campaign: z.string().trim().optional(),
};

export const whatsappClickSchema = z.object({
  event_id: z.string().uuid(),
  session_id: z.string().min(1),
  product_id: z.string().min(1).optional(),
  category_id: z.string().min(1).optional(),
  ...utmFields,
});

export type WhatsappClickInput = z.infer<typeof whatsappClickSchema>;

export const analyticsEventSchema = z.object({
  event_type: z.enum([
    "page_view",
    "product_view",
    "add_to_cart",
    "checkout_start",
    "lead_submit",
    "whatsapp_click",
  ]),
  event_id: z.string().uuid(),
  session_id: z.string().min(1),
  product_id: z.string().min(1).optional(),
  category_id: z.string().min(1).optional(),
  ...utmFields,
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
