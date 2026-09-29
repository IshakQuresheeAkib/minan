import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const effects = vi.hoisted((): Array<() => void | (() => void)> => []);
const apiMocks = vi.hoisted(() => ({
  searchPublicOrders: vi.fn(),
}));
const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) => {
      effects.push(effect);
    },
    useState: <T,>(initial: T): [T, (value: T) => void] => [initial, () => undefined],
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

vi.mock("@/features/order-tracking/lib/orderTrackingApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/order-tracking/lib/orderTrackingApi")>(),
  searchPublicOrders: apiMocks.searchPublicOrders,
}));

import type { CustomerOrderTracking } from "@/features/order-tracking/lib/types";

import { PublicOrderLookup } from "./PublicOrderLookup";

describe("PublicOrderLookup", () => {
  afterEach(() => {
    effects.length = 0;
    apiMocks.searchPublicOrders.mockReset();
    routerMocks.replace.mockReset();
    vi.unstubAllGlobals();
  });

  it("clears a phone query without searching it", () => {
    const history = { replaceState: vi.fn() };
    vi.stubGlobal("window", {
      history,
      location: { pathname: "/orders", search: "?order=01712345678" },
    });

    renderToStaticMarkup(createElement(PublicOrderLookup, {
      clearInvalidOrderQuery: true,
    }));
    effects[0]?.();

    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/orders");
    expect(apiMocks.searchPublicOrders).not.toHaveBeenCalled();
  });

  it("automatically looks up a valid order deep link through the public API", async () => {
    const orderNumber = "MN-20260925-0001";
    vi.stubGlobal("window", {
      history: { replaceState: vi.fn() },
      location: { pathname: "/orders", search: "" },
    });
    apiMocks.searchPublicOrders.mockResolvedValue({
      kind: "order",
      order: {} as CustomerOrderTracking,
    });

    renderToStaticMarkup(createElement(PublicOrderLookup, {
      initialOrderNumber: orderNumber,
    }));
    effects[1]?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(routerMocks.replace).toHaveBeenCalledWith(
      `/orders?order=${orderNumber}`,
      { scroll: false },
    );
    expect(apiMocks.searchPublicOrders).toHaveBeenCalledWith(orderNumber, undefined);
  });
});
