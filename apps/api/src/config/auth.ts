import type { CookieOptions } from "express";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getCookieDomain(): string | undefined {
  return process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;
}

export function getAuthCookieOptions(maxAgeMs: number): CookieOptions {
  if (isProduction()) {
    const domain = getCookieDomain();

    return {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: maxAgeMs,
      ...(domain ? { domain } : {}),
    };
  }

  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function getAccessTokenCookieOptions(): CookieOptions {
  return getAuthCookieOptions(ACCESS_TOKEN_TTL_SECONDS * 1000);
}

export function getRefreshTokenCookieOptions(): CookieOptions {
  return getAuthCookieOptions(REFRESH_TOKEN_TTL_SECONDS * 1000);
}

export function getClearAuthCookieOptions(): CookieOptions {
  const base = getAuthCookieOptions(0);
  return { ...base, maxAge: 0 };
}
