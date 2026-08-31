import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { signAccessToken, verifyAccessToken } from "./tokens.js";
import {
  GUEST_ORDER_TOKEN_AUDIENCE,
  signGuestOrderAccessToken,
  verifyGuestOrderAccessToken,
} from "./guestOrderTokens.js";
import { verifyCustomerAccessToken } from "./customerTokens.js";

const guestPayload = {
  order_id: "66f000000000000000000001",
  order_number: "MN-20260831-0001",
  normalized_email: "guest@example.com",
  guest_access_version: 1,
  challenge_id: "66f000000000000000000002",
} as const;

describe("guest Order access tokens", () => {
  const previous = {
    adminAccess: process.env.JWT_ACCESS_SECRET,
    customerAccess: process.env.CUSTOMER_JWT_ACCESS_SECRET,
    guestAccess: process.env.GUEST_ORDER_JWT_SECRET,
  };

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "shared-test-secret";
    process.env.CUSTOMER_JWT_ACCESS_SECRET = "shared-test-secret";
    process.env.GUEST_ORDER_JWT_SECRET = "shared-test-secret";
  });

  afterEach(() => {
    for (const [key, value] of Object.entries({
      JWT_ACCESS_SECRET: previous.adminAccess,
      CUSTOMER_JWT_ACCESS_SECRET: previous.customerAccess,
      GUEST_ORDER_JWT_SECRET: previous.guestAccess,
    })) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("signs and verifies only the scoped guest Order claims", () => {
    const token = signGuestOrderAccessToken(guestPayload);

    expect(verifyGuestOrderAccessToken(token)).toEqual(guestPayload);
  });

  it("rejects guest credentials at admin and customer boundaries even with a shared secret", () => {
    const guestToken = signGuestOrderAccessToken(guestPayload);
    const adminToken = signAccessToken({
      id: "66f000000000000000000003",
      email: "admin@example.com",
      session_version: 1,
    });

    expect(() => verifyAccessToken(guestToken)).toThrow();
    expect(() => verifyCustomerAccessToken(guestToken)).toThrow();
    expect(() => verifyGuestOrderAccessToken(adminToken)).toThrow();
  });

  it("rejects expired or incomplete guest credentials", () => {
    const expired = jwt.sign(
      { ...guestPayload, actor: "guest_order" },
      "shared-test-secret",
      { audience: GUEST_ORDER_TOKEN_AUDIENCE, expiresIn: -1 },
    );
    const { challenge_id: _challengeId, ...incompletePayload } = guestPayload;
    const incomplete = jwt.sign(
      { ...incompletePayload, actor: "guest_order" },
      "shared-test-secret",
      { audience: GUEST_ORDER_TOKEN_AUDIENCE },
    );

    expect(() => verifyGuestOrderAccessToken(expired)).toThrow();
    expect(() => verifyGuestOrderAccessToken(incomplete)).toThrow(
      "Invalid guest Order token payload",
    );
  });
});
