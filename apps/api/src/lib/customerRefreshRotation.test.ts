import { afterEach, describe, expect, it } from "vitest";

import { signCustomerRefreshToken } from "./customerTokens.js";

describe("customer refresh credential rotation", () => {
  const previousSecret = process.env.CUSTOMER_JWT_REFRESH_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.CUSTOMER_JWT_REFRESH_SECRET;
    } else {
      process.env.CUSTOMER_JWT_REFRESH_SECRET = previousSecret;
    }
  });

  it("issues a distinct raw refresh credential for identical claims in one second", () => {
    process.env.CUSTOMER_JWT_REFRESH_SECRET = "customer-refresh-secret";
    const payload = {
      id: "66f000000000000000000002",
      email: "customer@example.com",
      session_version: 4,
      session_id: "66f000000000000000000003",
    };

    const first = signCustomerRefreshToken(payload);
    const rotated = signCustomerRefreshToken(payload);

    expect(rotated).not.toBe(first);
  });
});
