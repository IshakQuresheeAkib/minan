import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bkash: vi.fn(),
  customerAuth: vi.fn(),
  shipping: vi.fn(),
}));

vi.mock("./bkash.js", () => ({ getBkashConfig: mocks.bkash }));
vi.mock("./customerAuth.js", () => ({ getCustomerAuthSecrets: mocks.customerAuth }));
vi.mock("./shipping.js", () => ({ getShippingConfig: mocks.shipping }));

import { validateStartupConfiguration } from "./startupValidation.js";

describe("startup configuration validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("validates the remaining required configuration", () => {
    validateStartupConfiguration();

    expect(mocks.bkash).toHaveBeenCalledOnce();
    expect(mocks.customerAuth).toHaveBeenCalledOnce();
    expect(mocks.shipping).toHaveBeenCalledOnce();
  });
});
