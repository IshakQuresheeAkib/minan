import { describe, expect, it } from "vitest";

import { planOrderTrackingMigration } from "./orderTrackingMigration.js";

describe("Order tracking migration plan", () => {
  it("backfills only normalized email", () => {
    const plan = planOrderTrackingMigration([{
      _id: "order-1",
      email: "  Customer@Example.COM ",
    }]);

    expect(plan).toEqual({
      changes: [{
        _id: "order-1",
        match: {
          email: "  Customer@Example.COM ",
          normalized_email: { $exists: false },
        },
        set: {
          normalized_email: "customer@example.com",
        },
      }],
      unresolved: [],
    });
    expect(JSON.stringify(plan)).not.toContain("customer_id");
    expect(JSON.stringify(plan)).not.toContain("activity");
    expect(JSON.stringify(plan)).not.toContain("createdAt");
    expect(JSON.stringify(plan)).not.toContain("updatedAt");
  });

  it("is idempotent after the planned fields are present", () => {
    const plan = planOrderTrackingMigration([{
      _id: "order-1",
      email: "Customer@Example.COM",
      normalized_email: "customer@example.com",
    }]);

    expect(plan).toEqual({ changes: [], unresolved: [] });
  });

  it("matches the exact source values that a write would replace", () => {
    const plan = planOrderTrackingMigration([{
      _id: "order-1",
      email: "Customer@Example.COM",
      normalized_email: "stale@example.com",
    }]);

    expect(plan.changes[0]?.match).toEqual({
      email: "Customer@Example.COM",
      normalized_email: "stale@example.com",
    });
  });
});
