import { describe, expect, it } from "vitest";

import { normalizeEmail } from "./normalizeEmail.js";

describe("normalizeEmail", () => {
  it("uses one trim-and-lowercase rule without rewriting the address", () => {
    expect(normalizeEmail("  Customer+Orders@Example.COM  ")).toBe(
      "customer+orders@example.com",
    );
  });
});
