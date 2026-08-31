import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bkash: vi.fn(),
  customerAuth: vi.fn(),
  guestSecret: vi.fn(),
  guestSettings: vi.fn(),
  resend: vi.fn(),
  shipping: vi.fn(),
}));

vi.mock("./bkash.js", () => ({ getBkashConfig: mocks.bkash }));
vi.mock("./customerAuth.js", () => ({ getCustomerAuthSecrets: mocks.customerAuth }));
vi.mock("./guestOrderAccess.js", () => ({
  getGuestOrderAccessTokenSecret: mocks.guestSecret,
  getGuestOrderOtpSettings: mocks.guestSettings,
}));
vi.mock("./resend.js", () => ({ getResendConfig: mocks.resend }));
vi.mock("./shipping.js", () => ({ getShippingConfig: mocks.shipping }));

import { validateStartupConfiguration } from "./startupValidation.js";

describe("startup configuration validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("fails startup when the live guest OTP email configuration is invalid", () => {
    const resendError = new Error("RESEND_API_KEY must be a valid Resend API key");
    mocks.resend.mockImplementation(() => {
      throw resendError;
    });

    expect(validateStartupConfiguration).toThrow(resendError);
    expect(mocks.resend).toHaveBeenCalledOnce();
  });
});
