import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { CustomerSession } from "./CustomerSession.js";

describe("CustomerSession credential boundary", () => {
  it("stores only hashed refresh credentials with revocation and expiry metadata", async () => {
    const session = new CustomerSession({
      customer_id: new Types.ObjectId(),
      session_version: 2,
      refresh_token_hash: "$argon2id$current-hash",
      previous_refresh_token_hash: "$argon2id$previous-hash",
      expires_at: new Date("2026-09-06T00:00:00.000Z"),
      last_rotated_at: new Date("2026-08-30T00:00:00.000Z"),
      revoked_at: null,
    });

    await session.validate();
    const serialized = session.toJSON() as Record<string, unknown>;

    expect(CustomerSession.schema.path("refresh_token_hash").options.select).toBe(false);
    expect(
      CustomerSession.schema.path("previous_refresh_token_hash").options.select,
    ).toBe(false);
    expect(CustomerSession.schema.path("refresh_token")).toBeUndefined();
    expect(serialized).not.toHaveProperty("refresh_token_hash");
    expect(serialized).not.toHaveProperty("previous_refresh_token_hash");
  });

  it("declares cleanup and active-customer query indexes", () => {
    expect(CustomerSession.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ expires_at: 1 }, { expireAfterSeconds: 0 }],
        [
          { customer_id: 1, revoked_at: 1, expires_at: 1 },
          expect.objectContaining({}),
        ],
      ]),
    );
  });
});
