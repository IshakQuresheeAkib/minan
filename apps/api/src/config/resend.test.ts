import { describe, expect, it } from "vitest";

import { getResendConfig } from "./resend.js";

describe("Resend configuration", () => {
  it("accepts an API key and friendly sender on a verified domain", () => {
    expect(getResendConfig({
      RESEND_API_KEY: "re_test_123",
      RESEND_FROM: "MINAN <orders@minan.com>",
    })).toEqual({
      apiKey: "re_test_123",
      from: "MINAN <orders@minan.com>",
    });
  });

  it.each([
    [{ RESEND_FROM: "MINAN <orders@minan.com>" }, "RESEND_API_KEY"],
    [{ RESEND_API_KEY: "re_test_123" }, "RESEND_FROM"],
    [
      { RESEND_API_KEY: "not-a-resend-key", RESEND_FROM: "orders@minan.com" },
      "RESEND_API_KEY",
    ],
    [
      { RESEND_API_KEY: "re_test_123", RESEND_FROM: "not-an-email" },
      "RESEND_FROM",
    ],
  ])("rejects invalid configuration mentioning %s", (env, field) => {
    expect(() => getResendConfig(env)).toThrow(field);
  });
});
