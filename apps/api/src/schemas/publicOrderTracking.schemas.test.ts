import { describe, expect, it } from "vitest";

import { publicOrderSearchSchema } from "./publicOrderTracking.schemas.js";

describe("publicOrderSearchSchema", () => {
  it("accepts a bounded first-page search", () => {
    expect(publicOrderSearchSchema.parse({
      query: "  MN-20260901-0001 ",
      limit: 20,
    })).toEqual({
      query: "MN-20260901-0001",
      limit: 20,
    });
  });

  it("rejects unknown fields, malformed cursors, and overlong queries", () => {
    expect(() => publicOrderSearchSchema.parse({ query: "MN-20260901-0001", extra: true })).toThrow();
    expect(() => publicOrderSearchSchema.parse({ query: "x".repeat(65) })).toThrow();
    expect(() => publicOrderSearchSchema.parse({ query: "MN-20260901-0001", cursor: "not-a-cursor" })).toThrow();
  });
});
