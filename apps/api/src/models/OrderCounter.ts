import mongoose, { type Document, Schema } from "mongoose";

export interface OrderCounterDocument extends Document<string> {
  _id: string;
  sequence: number;
  updatedAt: Date;
}

const orderCounterSchema = new Schema<OrderCounterDocument>(
  {
    _id: { type: String, required: true },
    sequence: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const OrderCounter = mongoose.model<OrderCounterDocument>(
  "OrderCounter",
  orderCounterSchema,
);
