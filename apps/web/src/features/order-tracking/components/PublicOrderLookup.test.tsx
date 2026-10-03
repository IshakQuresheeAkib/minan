import { createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const hookState = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  refs: [] as Array<{ current: unknown }>,
  states: [] as unknown[],
  stateIndex: 0,
  refIndex: 0,
}));
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
      hookState.effects.push(effect);
    },
    useRef: <T,>(initial: T) => {
      const index = hookState.refIndex++;
      hookState.refs[index] ??= { current: initial };
      return hookState.refs[index] as { current: T };
    },
    useCallback: <T,>(callback: T): T => callback,
    useState: <T,>(
      initial: T,
    ): [T, (value: T | ((previous: T) => T)) => void] => {
      const index = hookState.stateIndex++;
      hookState.states[index] ??= initial;
      return [
        hookState.states[index] as T,
        (value) => {
          hookState.states[index] =
            typeof value === "function"
              ? (value as (previous: T) => T)(hookState.states[index] as T)
              : value;
        },
      ];
    },
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
    hookState.effects.length = 0;
    hookState.refs.length = 0;
    hookState.states.length = 0;
    hookState.stateIndex = 0;
    hookState.refIndex = 0;
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
    hookState.effects[0]?.();

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
    hookState.effects[2]?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(routerMocks.replace).toHaveBeenCalledWith(
      `/orders?order=${orderNumber}`,
      { scroll: false },
    );
    expect(apiMocks.searchPublicOrders).toHaveBeenCalledWith(orderNumber, undefined);
  });

  it("clears the prior lookup when navigation removes the order deep link", async () => {
    const orderNumber = "MN-20260925-0001";
    vi.stubGlobal("window", {
      history: { replaceState: vi.fn() },
      location: { pathname: "/orders", search: `?order=${orderNumber}` },
    });
    apiMocks.searchPublicOrders.mockRejectedValue(new Error("Unavailable"));

    const render = (props: { initialOrderNumber?: string | null }) => {
      hookState.effects.length = 0;
      hookState.stateIndex = 0;
      hookState.refIndex = 0;
      return renderToStaticMarkup(
        createElement(PublicOrderLookup, props),
      );
    };

    render({ initialOrderNumber: orderNumber });
    hookState.effects[2]?.();
    await Promise.resolve();
    await Promise.resolve();

    const staleMarkup = render({ initialOrderNumber: null });
    hookState.effects.forEach((effect) => effect());
    const clearedMarkup = render({ initialOrderNumber: null });

    expect(staleMarkup).toContain(orderNumber);
    expect(clearedMarkup).not.toContain(orderNumber);
    expect(clearedMarkup).not.toContain("We could not complete that lookup");
  });

  it("keeps a phone search started from an order deep link", async () => {
    const orderNumber = "MN-20260925-0001";
    const phoneNumber = "01712345678";
    vi.stubGlobal("window", {
      history: { replaceState: vi.fn() },
      location: { pathname: "/orders", search: `?order=${orderNumber}` },
    });
    apiMocks.searchPublicOrders.mockResolvedValue({
      kind: "phone",
      orders: [],
      next_cursor: null,
    });

    const render = (initial: string | null) => {
      hookState.effects.length = 0;
      hookState.stateIndex = 0;
      hookState.refIndex = 0;
      return PublicOrderLookup({ initialOrderNumber: initial });
    };
    const getForm = (tree: ReactElement<{ children: ReactNode }>) => {
      const children = tree.props.children as ReactElement[];
      return children[1] as ReactElement<{
        children: ReactNode;
        onSubmit: (event: { preventDefault: () => void }) => void;
      }>;
    };

    const input = getForm(render(orderNumber)).props.children as ReactElement[];
    const queryInput = input[1] as ReactElement<{
      onChange: (event: { target: { value: string } }) => void;
    }>;
    queryInput.props.onChange({ target: { value: phoneNumber } });

    getForm(render(orderNumber)).props.onSubmit({ preventDefault: vi.fn() });
    await new Promise((resolve) => setTimeout(resolve, 0));

    render(null);
    hookState.effects.forEach((effect) => effect());
    const markup = renderToStaticMarkup(render(null));

    expect(routerMocks.replace).toHaveBeenCalledWith("/orders", {
      scroll: false,
    });
    expect(apiMocks.searchPublicOrders).toHaveBeenCalledWith(phoneNumber, undefined);
    expect(markup).toContain(`value="${phoneNumber}"`);
    expect(markup).toContain("Orders for this phone number");
  });
});
