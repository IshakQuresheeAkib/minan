import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  randomInt: vi.fn(),
}));

vi.mock("node:crypto", () => ({
  randomInt: mocks.randomInt,
}));

import { generateGuestOrderOtp } from "./guestOrderAccess.service.js";

describe("guest Order OTP generation", () => {
  it("uses Node cryptographic randomness and preserves a six-digit code shape", () => {
    mocks.randomInt.mockReturnValue(42);

    expect(generateGuestOrderOtp()).toBe("000042");
    expect(mocks.randomInt).toHaveBeenCalledWith(0, 1_000_000);
  });
});
