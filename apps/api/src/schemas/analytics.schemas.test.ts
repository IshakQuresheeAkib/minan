import { describe, expect, it } from "vitest";

import {
  analyticsEventSchema,
  whatsappClickSchema,
} from "./analytics.schemas.js";

describe("analytics.schemas", () => {
  it("validates valid whatsapp click input", () => {
    const input = {
      event_id: "123e4567-e89b-12d3-a456-426614174000",
      session_id: "sess_123",
      product_id: "507f1f77bcf86cd799439011",
      category_id: "507f1f77bcf86cd799439012",
      fbp: "fb.1.1710000000.123456789",
      fbc: "fb.1.1710000000.abc123xyz",
    };

    const parsed = whatsappClickSchema.parse(input);
    expect(parsed.fbp).toBe("fb.1.1710000000.123456789");
    expect(parsed.fbc).toBe("fb.1.1710000000.abc123xyz");
  });

  it("rejects fbp or fbc longer than 255 characters", () => {
    const tooLong = "a".repeat(256);

    expect(
      whatsappClickSchema.safeParse({
        event_id: "123e4567-e89b-12d3-a456-426614174000",
        session_id: "sess_123",
        fbp: tooLong,
      }).success,
    ).toBe(false);

    expect(
      analyticsEventSchema.safeParse({
        event_type: "product_view",
        event_id: "evt_123",
        session_id: "sess_123",
        fbc: tooLong,
      }).success,
    ).toBe(false);
  });
});
