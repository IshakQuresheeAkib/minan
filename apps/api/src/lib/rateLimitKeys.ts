import { createHash } from "node:crypto";

import { ipKeyGenerator } from "express-rate-limit";

export function opaqueTokenRateLimitKey(
  prefix: string,
  token: unknown,
  fallbackIp: string,
): string {
  if (typeof token === "string") {
    const normalized = token.trim();
    if (normalized.length >= 32 && normalized.length <= 200) {
      const digest = createHash("sha256").update(normalized).digest("hex");
      return `${prefix}:token:${digest}`;
    }
  }
  return `${prefix}:ip:${ipKeyGenerator(fallbackIp)}`;
}
