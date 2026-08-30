import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { signAccessToken, verifyAccessToken } from "./tokens.js";
import {
  CUSTOMER_TOKEN_AUDIENCE,
  signCustomerAccessToken,
  signCustomerRefreshToken,
  verifyCustomerAccessToken,
  verifyCustomerRefreshToken,
} from "./customerTokens.js";

const customerPayload = {
  id: "66f000000000000000000002",
  email: "Customer@Example.com",
  session_version: 4,
  session_id: "66f000000000000000000003",
} as const;

describe("customer token actor and audience separation", () => {
  const previous = {
    adminAccess: process.env.JWT_ACCESS_SECRET,
    customerAccess: process.env.CUSTOMER_JWT_ACCESS_SECRET,
    customerRefresh: process.env.CUSTOMER_JWT_REFRESH_SECRET,
  };

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "shared-test-secret";
    process.env.CUSTOMER_JWT_ACCESS_SECRET = "shared-test-secret";
    process.env.CUSTOMER_JWT_REFRESH_SECRET = "customer-refresh-secret";
  });

  afterEach(() => {
    for (const [key, value] of Object.entries({
      JWT_ACCESS_SECRET: previous.adminAccess,
      CUSTOMER_JWT_ACCESS_SECRET: previous.customerAccess,
      CUSTOMER_JWT_REFRESH_SECRET: previous.customerRefresh,
    })) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("round-trips allowlisted customer access and refresh claims", () => {
    const accessToken = signCustomerAccessToken(customerPayload);
    const refreshToken = signCustomerRefreshToken(customerPayload);

    expect(verifyCustomerAccessToken(accessToken)).toEqual(customerPayload);
    expect(verifyCustomerRefreshToken(refreshToken)).toEqual(customerPayload);
  });

  it("rejects customer access tokens at the admin boundary even with a shared secret", () => {
    const customerToken = signCustomerAccessToken(customerPayload);
    const adminToken = signAccessToken({
      id: "66f000000000000000000001",
      email: "admin@example.com",
      session_version: 1,
    });

    expect(() => verifyAccessToken(customerToken)).toThrow();
    expect(() => verifyCustomerAccessToken(adminToken)).toThrow();
  });

  it("rejects expired customer tokens", () => {
    const token = jwt.sign(
      { ...customerPayload, actor: "customer" },
      "shared-test-secret",
      { audience: CUSTOMER_TOKEN_AUDIENCE, expiresIn: -1 },
    );

    expect(() => verifyCustomerAccessToken(token)).toThrow();
  });
});
