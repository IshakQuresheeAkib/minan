import { describe, expect, it } from "vitest";

import { opaqueTokenRateLimitKey } from "./rateLimitKeys.js";

describe("opaque token rate-limit keys", () => {
  it("keys valid payment references independently without exposing the token", () => {
    const firstToken = "a".repeat(43);
    const secondToken = "b".repeat(43);
    const first = opaqueTokenRateLimitKey("bkash-result", firstToken, "203.0.113.1");
    const replay = opaqueTokenRateLimitKey("bkash-result", firstToken, "203.0.113.2");
    const second = opaqueTokenRateLimitKey("bkash-result", secondToken, "203.0.113.1");

    expect(replay).toBe(first);
    expect(second).not.toBe(first);
    expect(first).not.toContain(firstToken);
  });
});
