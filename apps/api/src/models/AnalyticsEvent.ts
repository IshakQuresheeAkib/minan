import mongoose, { type Document, Schema, type Types } from "mongoose";

export const ANALYTICS_EVENT_TYPES = [
  "page_view",
  "product_view",
  "add_to_cart",
  "checkout_start",
  "lead_submit",
  "whatsapp_click",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export interface AnalyticsEventDocument extends Document {
  event_type: AnalyticsEventType;
  event_id: string;
  product_id?: Types.ObjectId;
  category_id?: Types.ObjectId;
  session_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<AnalyticsEventDocument>(
  {
    event_type: {
      type: String,
      required: true,
      enum: ANALYTICS_EVENT_TYPES,
    },
    event_id: { type: String, required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product" },
    category_id: { type: Schema.Types.ObjectId, ref: "Category" },
    session_id: { type: String, required: true },
    utm_source: { type: String, trim: true },
    utm_medium: { type: String, trim: true },
    utm_campaign: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

analyticsEventSchema.index({ event_type: 1, createdAt: -1 });
analyticsEventSchema.index({ event_id: 1 }, { unique: true });

export const AnalyticsEvent = mongoose.model<AnalyticsEventDocument>(
  "AnalyticsEvent",
  analyticsEventSchema,
);
