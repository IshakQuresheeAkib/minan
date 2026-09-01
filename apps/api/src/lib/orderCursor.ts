import { Types } from "mongoose";

export type OrderCursor = {
  createdAt: Date;
  id: Types.ObjectId;
};

type EncodedOrderCursor = {
  createdAt: string;
  id: string;
};

export function encodeOrderCursor(cursor: OrderCursor): string {
  const value: EncodedOrderCursor = {
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id.toString(),
  };
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function decodeOrderCursor(value: string): OrderCursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<EncodedOrderCursor>;
    const createdAt = typeof parsed.createdAt === "string" ? new Date(parsed.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime()) || typeof parsed.id !== "string" || !Types.ObjectId.isValid(parsed.id)) {
      throw new Error("Invalid cursor");
    }
    return { createdAt, id: new Types.ObjectId(parsed.id) };
  } catch {
    throw new Error("Invalid cursor");
  }
}
