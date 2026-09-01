import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { decodeOrderCursor, encodeOrderCursor } from "./orderCursor.js";

describe("order history cursor", () => {
  it("round-trips a timestamp and ObjectId without exposing a query parameter format", () => {
    const cursor = encodeOrderCursor({
      createdAt: new Date("2026-09-01T10:00:00.000Z"),
      id: new Types.ObjectId("66f000000000000000000001"),
    });

    expect(cursor).not.toContain("2026");
    expect(decodeOrderCursor(cursor)).toEqual({
      createdAt: new Date("2026-09-01T10:00:00.000Z"),
      id: new Types.ObjectId("66f000000000000000000001"),
    });
  });

  it("rejects malformed and impossible cursors", () => {
    expect(() => decodeOrderCursor("not-a-cursor")).toThrow("Invalid cursor");
    expect(() => decodeOrderCursor(Buffer.from('{"createdAt":"invalid","id":"x"}').toString("base64url"))).toThrow("Invalid cursor");
  });
});
