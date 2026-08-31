import { afterEach, describe, expect, it } from "vitest";

import {
  getGuestOrderAccessCookieOptions,
  getGuestOrderOtpSettings,
} from "./guestOrderAccess.js";

const environmentKeys = [
  "NODE_ENV",
  "AUTH_COOKIE_DOMAIN",
  "GUEST_ORDER_OTP_TTL_SECONDS",
  "GUEST_ORDER_OTP_ATTEMPT_LIMIT",
  "GUEST_ORDER_OTP_RESEND_COOLDOWN_SECONDS",
] as const;
const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of environmentKeys) {
    const value = originalEnvironment[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("guest Order access configuration", () => {
  it("uses a dedicated secure production cookie", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_COOKIE_DOMAIN = ".minan.com";

    expect(getGuestOrderAccessCookieOptions()).toEqual(expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".minan.com",
    }));
  });

  it("validates OTP expiry, attempt, and resend settings", () => {
    process.env.GUEST_ORDER_OTP_TTL_SECONDS = "600";
    process.env.GUEST_ORDER_OTP_ATTEMPT_LIMIT = "5";
    process.env.GUEST_ORDER_OTP_RESEND_COOLDOWN_SECONDS = "60";

    expect(getGuestOrderOtpSettings()).toEqual({
      ttlSeconds: 600,
      attemptLimit: 5,
      resendCooldownSeconds: 60,
    });

    process.env.GUEST_ORDER_OTP_ATTEMPT_LIMIT = "0";
    expect(() => getGuestOrderOtpSettings()).toThrow("GUEST_ORDER_OTP_ATTEMPT_LIMIT");
  });
});
