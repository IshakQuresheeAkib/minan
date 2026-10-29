import { describe, expect, it } from "vitest";

import { BKASH_ERROR_CODES, getBkashErrorMessage } from "./bkashErrorCodes.js";

describe("bkashErrorCodes", () => {
  it("returns official English descriptions for known error codes", () => {
    expect(getBkashErrorMessage("2029")).toBe("This payment looks like a duplicate. Check your bKash statement before you try again.");
    expect(getBkashErrorMessage("2017")).toBe("Wrong verification limit exceeded");
    expect(getBkashErrorMessage("2010")).toBe("Invalid OTP");
    expect(getBkashErrorMessage("2014")).toBe("Wrong PIN");
    expect(getBkashErrorMessage("2023")).toBe("Insufficient Balance");
    expect(getBkashErrorMessage("503")).toBe("System is undergoing maintenance. Please try again later");
  });

  it("returns fallback message or undefined for unknown codes", () => {
    expect(getBkashErrorMessage("9999", "Custom failure")).toBe("Custom failure");
    expect(getBkashErrorMessage("9999")).toBeUndefined();
    expect(getBkashErrorMessage(undefined, "Fallback")).toBe("Fallback");
  });

  it("contains all standard payment error codes from developer portal", () => {
    expect(BKASH_ERROR_CODES["2001"]).toBe("Invalid App Key");
    expect(BKASH_ERROR_CODES["2002"]).toBe("Invalid Payment ID");
    expect(BKASH_ERROR_CODES["2003"]).toBe("Process failed");
  });
});
