// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  restoreCustomerSession: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  apiRequest: mocks.apiRequest,
}));

vi.mock("@/features/order-tracking/lib/customerSession", () => ({
  restoreCustomerSession: mocks.restoreCustomerSession,
}));

import { useCheckoutConfig } from "./useCheckoutConfig";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

const mockConfig = {
  shipping_options: [
    { id: "inside_sylhet", label: "Inside Sylhet Shipping Cost", delivery_fee: 60 },
    { id: "outside_sylhet", label: "Outside Sylhet Shipping Cost", delivery_fee: 120 },
  ],
  currency: "BDT",
  refundable: false,
  payment_contract: { version: 2 as const, methods: ["bkash_full", "cod"] as ["bkash_full", "cod"] },
};

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useCustomerAuthStore.setState({ session: null, status: "unknown" });
});

afterEach(cleanup);

describe("useCheckoutConfig", () => {
  it("restores customer session on mount when status is unknown, then fetches config with token", async () => {
    const mockSession = {
      customer: { id: "cust-uat-1", email: "bkash-uat@minan.com", is_active: true },
      accessToken: "uat-token-123",
    };

    mocks.restoreCustomerSession.mockImplementation(async () => {
      useCustomerAuthStore.getState().setSession(mockSession);
      return mockSession;
    });
    mocks.apiRequest.mockResolvedValue({ data: mockConfig });

    const { result } = renderHook(() => useCheckoutConfig(), { wrapper });

    expect(mocks.restoreCustomerSession).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.config).toEqual(mockConfig);
      expect(result.current.configLoading).toBe(false);
    });

    expect(mocks.apiRequest).toHaveBeenCalledWith(
      "/api/checkout/config",
      { accessToken: "uat-token-123", _retrying: true },
    );
  });

  it("fetches guest config without token when session is anonymous", async () => {
    useCustomerAuthStore.getState().clearSession();
    mocks.apiRequest.mockResolvedValue({ data: mockConfig });

    const { result } = renderHook(() => useCheckoutConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.config).toEqual(mockConfig);
    });

    expect(mocks.restoreCustomerSession).not.toHaveBeenCalled();
    expect(mocks.apiRequest).toHaveBeenCalledWith("/api/checkout/config", {});
  });
});
