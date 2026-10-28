import { AppError } from "../lib/errors.js";

export type BkashConfig = {
  baseUrl: string;
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  apiPublicUrl: string;
  frontendUrl: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new AppError(`Payment configuration is missing ${name}`, 503);
  return value;
}

function normalizedUrl(name: string): string {
  const value = required(name).replace(/\/$/, "");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AppError(`Payment configuration has an invalid ${name}`, 503);
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new AppError(`${name} must use HTTPS in production`, 503);
  }
  return value;
}

export function getBkashConfig(): BkashConfig {
  return {
    baseUrl: normalizedUrl("BKASH_BASE_URL"),
    appKey: required("BKASH_APP_KEY"),
    appSecret: required("BKASH_APP_SECRET"),
    username: required("BKASH_USERNAME"),
    password: required("BKASH_PASSWORD"),
    apiPublicUrl: normalizedUrl("API_PUBLIC_URL"),
    frontendUrl: normalizedUrl("FRONTEND_URL"),
  };
}

export function isBkashRestricted(): boolean {
  return process.env.BKASH_RESTRICT_ACCESS === "true";
}

export function getAllowedUatEmails(): string[] {
  const raw =
    process.env.BKASH_UAT_ALLOWED_EMAILS?.trim() ||
    "bkash-uat@minan.com";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isCustomerAllowedForBkash(email?: string, uatToken?: string): boolean {
  if (!isBkashRestricted()) return true;
  const bypassToken = process.env.BKASH_UAT_BYPASS_TOKEN?.trim();
  if (bypassToken && uatToken === bypassToken) {
    return true;
  }
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const allowed = getAllowedUatEmails();
  return allowed.includes(normalized);
}
