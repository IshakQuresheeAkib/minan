import { describe, expect, it } from "vitest";

import { shouldStripPaymentResultReference } from "./paymentResultReference";

describe("payment result reference lifecycle", () => {
  it("strips the bearer reference only after payment completion", () => {
    expect(shouldStripPaymentResultReference("completed")).toBe(true);
    expect(shouldStripPaymentResultReference("failed")).toBe(false);
    expect(shouldStripPaymentResultReference("cancelled")).toBe(false);
    expect(shouldStripPaymentResultReference("verification_pending")).toBe(false);
    expect(shouldStripPaymentResultReference("initiated")).toBe(false);
  });
});
