import type { CookieOptions } from "express";

import { getAuthCookieOptions } from "./auth.js";

export const CUSTOMER_ACCESS_TOKEN_COOKIE = "customer_access_token";
export const CUSTOMER_REFRESH_TOKEN_COOKIE = "customer_refresh_token";

export const CUSTOMER_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const CUSTOMER_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export function getCustomerAccessCookieOptions(): CookieOptions {
  return getAuthCookieOptions(CUSTOMER_ACCESS_TOKEN_TTL_SECONDS * 1000);
}

export function getCustomerRefreshCookieOptions(): CookieOptions {
  return getAuthCookieOptions(CUSTOMER_REFRESH_TOKEN_TTL_SECONDS * 1000);
}

export function getClearCustomerAuthCookieOptions(): CookieOptions {
  return { ...getAuthCookieOptions(0), maxAge: 0 };
}
