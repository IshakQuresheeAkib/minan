import type { CookieOptions } from "express";

import { getAuthCookieOptions } from "./auth.js";

export const GUEST_ORDER_ACCESS_TOKEN_COOKIE = "guest_order_access_token";
export const GUEST_ORDER_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

const DEFAULT_GUEST_ORDER_OTP_TTL_SECONDS = 10 * 60;
const DEFAULT_GUEST_ORDER_OTP_ATTEMPT_LIMIT = 5;
const DEFAULT_GUEST_ORDER_OTP_RESEND_COOLDOWN_SECONDS = 60;

export type GuestOrderOtpSettings = {
  ttlSeconds: number;
  attemptLimit: number;
  resendCooldownSeconds: number;
};

function positiveIntegerSetting(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

export function getGuestOrderOtpSettings(): GuestOrderOtpSettings {
  return {
    ttlSeconds: positiveIntegerSetting(
      "GUEST_ORDER_OTP_TTL_SECONDS",
      DEFAULT_GUEST_ORDER_OTP_TTL_SECONDS,
      60,
      15 * 60,
    ),
    attemptLimit: positiveIntegerSetting(
      "GUEST_ORDER_OTP_ATTEMPT_LIMIT",
      DEFAULT_GUEST_ORDER_OTP_ATTEMPT_LIMIT,
      1,
      10,
    ),
    resendCooldownSeconds: positiveIntegerSetting(
      "GUEST_ORDER_OTP_RESEND_COOLDOWN_SECONDS",
      DEFAULT_GUEST_ORDER_OTP_RESEND_COOLDOWN_SECONDS,
      30,
      10 * 60,
    ),
  };
}

export function getGuestOrderAccessTokenSecret(): string {
  const secret = process.env.GUEST_ORDER_JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("GUEST_ORDER_JWT_SECRET is not defined");
  }
  return secret;
}

export function getGuestOrderAccessCookieOptions(): CookieOptions {
  return getAuthCookieOptions(GUEST_ORDER_ACCESS_TOKEN_TTL_SECONDS * 1000);
}
