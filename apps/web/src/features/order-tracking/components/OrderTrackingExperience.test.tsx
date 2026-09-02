import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderTrackingApiError } from "@/features/order-tracking/lib/orderTrackingApi";

const effectCleanups = vi.hoisted((): Array<() => void> => []);
const apiMocks = vi.hoisted(() => ({
  getCustomerOrder: vi.fn(),
}));
const authState = vi.hoisted(() => ({
  session: {
    customer: {
      email: "buyer@example.com",
      id: "customer-1",
      is_active: true,
    },
    accessToken: "expired-access-token",
  },
  status: "authenticated" as const,
  clearSession: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) => {
      const cleanup = effect();
      if (typeof cleanup === "function") {
        effectCleanups.push(cleanup);
      }
    },
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({
    access: "account",
    order: "MN-20260901-0001",
  }),
}));

vi.mock("@/features/order-tracking/lib/customerSession", () => ({
  restoreCustomerSession: vi.fn(),
}));

vi.mock("@/features/order-tracking/lib/orderTrackingApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/order-tracking/lib/orderTrackingApi")>(),
  getCustomerOrder: apiMocks.getCustomerOrder,
}));

vi.mock("@/store/customer-auth.store", () => ({
  useCustomerAuthStore: () => authState,
}));

import { OrderTrackingExperience } from "./OrderTrackingExperience";

function deferred<T>() {
  let rejectPromise: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((_resolve, reject) => {
    rejectPromise = reject;
  });

  return { promise, reject: rejectPromise };
}

describe("OrderTrackingExperience", () => {
  afterEach(() => {
    effectCleanups.length = 0;
    apiMocks.getCustomerOrder.mockReset();
    authState.clearSession.mockReset();
    authState.session.accessToken = "expired-access-token";
  });

  it("does not clear a fresh session when an inactive order request later returns 401", async () => {
    const pendingOrder = deferred<never>();
    apiMocks.getCustomerOrder.mockReturnValue(pendingOrder.promise);

    renderToStaticMarkup(<OrderTrackingExperience />);
    effectCleanups.forEach((cleanup) => cleanup());
    authState.session.accessToken = "fresh-access-token";

    pendingOrder.reject(new OrderTrackingApiError("Unauthorized", 401));
    await Promise.resolve();
    await Promise.resolve();

    expect(authState.clearSession).not.toHaveBeenCalled();
  });
});
