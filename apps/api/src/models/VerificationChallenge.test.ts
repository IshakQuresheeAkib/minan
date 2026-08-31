import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { VerificationChallenge } from "./VerificationChallenge.js";

describe("VerificationChallenge", () => {
  it("stores only the hashed OTP and keeps the guest access challenge scoped to one Order", async () => {
    const challenge = new VerificationChallenge({
      order_id: new Types.ObjectId(),
      normalized_email: "guest@example.com",
      purpose: "guest_order_access",
      otp_hash: "$argon2id$v=19$hash-only",
      attempt_limit: 5,
      expires_at: new Date("2026-08-31T10:05:00.000Z"),
      resend_available_at: new Date("2026-08-31T10:01:00.000Z"),
    });

    await challenge.validate();

    expect(challenge.attempt_count).toBe(0);
    expect(challenge.consumed_at).toBeNull();
    expect(challenge.revoked_at).toBeNull();
    expect(challenge.toJSON()).not.toHaveProperty("otp_hash");
    expect(challenge.toObject()).not.toHaveProperty("otp_hash");
  });

  it("indexes expiry and active guest Order lookup paths", () => {
    const indexes = VerificationChallenge.schema.indexes();

    expect(indexes).toContainEqual([
      { expires_at: 1 },
      { expireAfterSeconds: 0 },
    ]);
    expect(indexes.map(([fields]) => fields)).toContainEqual({
      order_id: 1,
      normalized_email: 1,
      purpose: 1,
      consumed_at: 1,
      revoked_at: 1,
      expires_at: 1,
    });
  });
});
