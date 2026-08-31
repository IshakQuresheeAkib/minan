import { describe, expect, it } from "vitest";

import { orderTrackingUpdateSchema } from "./order.schemas.js";

describe("orderTrackingUpdateSchema", () => {
  it("accepts a UTC calendar date and a customer-safe public note", () => {
    expect(orderTrackingUpdateSchema.parse({
      expected_delivery_date: "2026-09-05",
      public_note: "Your order is expected this Friday.",
      expected_revision: 4,
    })).toEqual({
      expected_delivery_date: "2026-09-05",
      public_note: "Your order is expected this Friday.",
      expected_revision: 4,
    });
  });

  it("rejects timestamps, unknown fields, and empty public notes", () => {
    expect(() => orderTrackingUpdateSchema.parse({
      expected_delivery_date: "2026-09-05T12:00:00Z",
      expected_revision: 4,
    })).toThrow();
    expect(() => orderTrackingUpdateSchema.parse({
      public_note: "   ",
      expected_revision: 4,
    })).toThrow();
    expect(() => orderTrackingUpdateSchema.parse({
      expected_delivery_date: "2026-09-05",
      expected_revision: 4,
      reason: "Internal reason must never be accepted as a public note.",
    })).toThrow();
  });
});
