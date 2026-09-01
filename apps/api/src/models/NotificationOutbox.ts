import mongoose, { type Document, Schema, Types } from "mongoose";

import type { CustomerOrderTrackingDTO } from "../utils/serializeCustomerOrder.js";

export type NotificationEventType =
  | "order_created"
  | "status_confirmed"
  | "status_shipped"
  | "status_delivered"
  | "status_cancelled";

export type NotificationOutboxStatus = "pending" | "processing" | "sent" | "failed";

export interface NotificationOutboxDocument extends Document<Types.ObjectId> {
  order_id: Types.ObjectId;
  recipient_email: string;
  event_type: NotificationEventType;
  dedupe_key: string;
  payload: { order: CustomerOrderTrackingDTO };
  status: NotificationOutboxStatus;
  attempt_count: number;
  available_at: Date;
  locked_at?: Date;
  lease_token?: string;
  sent_at?: Date;
  provider_message_id?: string;
  last_error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationOutboxSchema = new Schema<NotificationOutboxDocument>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    recipient_email: { type: String, required: true, trim: true, maxlength: 254 },
    event_type: {
      type: String,
      enum: ["order_created", "status_confirmed", "status_shipped", "status_delivered", "status_cancelled"],
      required: true,
    },
    dedupe_key: { type: String, required: true, unique: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["pending", "processing", "sent", "failed"], required: true, default: "pending", index: true },
    attempt_count: { type: Number, required: true, min: 0, default: 0 },
    available_at: { type: Date, required: true, index: true },
    locked_at: { type: Date },
    lease_token: { type: String, maxlength: 64 },
    sent_at: { type: Date },
    provider_message_id: { type: String, maxlength: 255 },
    last_error: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

notificationOutboxSchema.index({ status: 1, available_at: 1, locked_at: 1 });

export const NotificationOutbox = mongoose.model<NotificationOutboxDocument>(
  "NotificationOutbox",
  notificationOutboxSchema,
);
