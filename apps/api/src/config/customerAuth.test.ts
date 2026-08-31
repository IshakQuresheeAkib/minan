import { afterEach, describe, expect, it } from "vitest";

import {
  CUSTOMER_ACCESS_TOKEN_COOKIE,
  CUSTOMER_REFRESH_TOKEN_COOKIE,
  getCustomerAuthSecrets,
  getCustomerAccessCookieOptions,
  getCustomerRefreshCookieOptions,
} from "./customerAuth.js";

describe("customer authentication cookies", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousCookieDomain = process.env.AUTH_COOKIE_DOMAIN;
  const previousAccessSecret = process.env.CUSTOMER_JWT_ACCESS_SECRET;
  const previousRefreshSecret = process.env.CUSTOMER_JWT_REFRESH_SECRET;

  afterEach(() => {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    if (previousCookieDomain === undefined) {
      delete process.env.AUTH_COOKIE_DOMAIN;
    } else {
      process.env.AUTH_COOKIE_DOMAIN = previousCookieDomain;
    }
    if (previousAccessSecret === undefined) {
      delete process.env.CUSTOMER_JWT_ACCESS_SECRET;
    } else {
      process.env.CUSTOMER_JWT_ACCESS_SECRET = previousAccessSecret;
    }
    if (previousRefreshSecret === undefined) {
      delete process.env.CUSTOMER_JWT_REFRESH_SECRET;
    } else {
      process.env.CUSTOMER_JWT_REFRESH_SECRET = previousRefreshSecret;
    }
  });

  it.each([
    "CUSTOMER_JWT_ACCESS_SECRET",
    "CUSTOMER_JWT_REFRESH_SECRET",
  ])("rejects startup configuration when %s is missing", (missingName) => {
    process.env.CUSTOMER_JWT_ACCESS_SECRET = "customer-access-secret";
    process.env.CUSTOMER_JWT_REFRESH_SECRET = "customer-refresh-secret";
    delete process.env[missingName];

    expect(() => getCustomerAuthSecrets()).toThrow(
      `${missingName} is not defined`,
    );
  });

  it("uses names that cannot collide with admin cookies", () => {
    expect(CUSTOMER_ACCESS_TOKEN_COOKIE).toBe("customer_access_token");
    expect(CUSTOMER_REFRESH_TOKEN_COOKIE).toBe("customer_refresh_token");
    expect(CUSTOMER_ACCESS_TOKEN_COOKIE).not.toBe("access_token");
    expect(CUSTOMER_REFRESH_TOKEN_COOKIE).not.toBe("refresh_token");
  });

  it("sets secure cross-subdomain production cookie flags", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_COOKIE_DOMAIN = ".minan.com";

    expect(getCustomerAccessCookieOptions()).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".minan.com",
      path: "/",
    });
    expect(getCustomerRefreshCookieOptions()).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".minan.com",
      path: "/",
    });
  });
});
