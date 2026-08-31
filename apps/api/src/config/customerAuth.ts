import type { CookieOptions } from "express";

import { getAuthCookieOptions } from "./auth.js";

export const CUSTOMER_ACCESS_TOKEN_COOKIE = "customer_access_token";
export const CUSTOMER_REFRESH_TOKEN_COOKIE = "customer_refresh_token";

export const CUSTOMER_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const CUSTOMER_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export type CustomerAuthSecrets = {
  accessTokenSecret: string;
  refreshTokenSecret: string;
};

function requiredSecret(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return value;
}

export function getCustomerAuthSecrets(): CustomerAuthSecrets {
  const accessTokenSecret = getCustomerAccessTokenSecret();
  const refreshTokenSecret = getCustomerRefreshTokenSecret();

  if (accessTokenSecret === refreshTokenSecret) {
    throw new Error(
      "CUSTOMER_JWT_ACCESS_SECRET and CUSTOMER_JWT_REFRESH_SECRET must differ",
    );
  }

  return {
    accessTokenSecret,
    refreshTokenSecret,
  };
}

export function getCustomerAccessTokenSecret(): string {
  return requiredSecret("CUSTOMER_JWT_ACCESS_SECRET");
}

export function getCustomerRefreshTokenSecret(): string {
  return requiredSecret("CUSTOMER_JWT_REFRESH_SECRET");
}

export function getCustomerAccessCookieOptions(): CookieOptions {
  return getAuthCookieOptions(CUSTOMER_ACCESS_TOKEN_TTL_SECONDS * 1000);
}

export function getCustomerRefreshCookieOptions(): CookieOptions {
  return getAuthCookieOptions(CUSTOMER_REFRESH_TOKEN_TTL_SECONDS * 1000);
}

export function getClearCustomerAuthCookieOptions(): CookieOptions {
  return { ...getAuthCookieOptions(0), maxAge: 0 };
}
