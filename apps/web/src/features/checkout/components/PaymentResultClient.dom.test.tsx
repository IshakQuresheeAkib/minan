// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Suspense, use, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PaymentResult, PaymentStartResult } from "@/features/checkout/types";
import { ApiError } from "@/lib/api/client";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  retry: vi.fn<(token: string) => Promise<{ data: PaymentStartResult }>>(),
  clearCart: vi.fn(),
  clearBuyNow: vi.fn(),
  clearKey: vi.fn(),
  track: vi.fn(),
  enableAnalytics: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  assign: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/features/checkout/actions/checkout.actions", () => ({ retryCheckoutPayment: mocks.retry }));
vi.mock("@/features/checkout/lib/checkoutSession", () => ({ clearCheckoutIdempotencyKey: mocks.clearKey }));
vi.mock("@/lib/analytics/ga4", () => ({ trackGa4Purchase: mocks.track }));
vi.mock("@/lib/analytics/routes", () => ({ enableGa4ForCompletedPaymentResult: mocks.enableAnalytics }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, info: mocks.info } }));
vi.mock("@/store/cart.store", () => ({
  useCartStore: (selector: (state: { clearCart: typeof mocks.clearCart }) => unknown) => selector({ clearCart: mocks.clearCart }),
}));
vi.mock("@/store/buy-now.store", () => ({
  useBuyNowStore: (selector: (state: { clearItem: typeof mocks.clearBuyNow }) => unknown) => selector({ clearItem: mocks.clearBuyNow }),
}));

import { PaymentResultClient } from "./PaymentResultClient";

const pending: PaymentResult = {
  state: "verification_pending",
  message: "Verification is pending.",
  checkout_source: "cart",
};
const failed: PaymentResult = { ...pending, state: "failed", retry_token: "server-token" };
const completed: PaymentResult = {
  state: "completed",
  message: "Your payment succeeded.",
  order_number: "MN-20260923-0042",
  payment_method: "cod",
  fee_paid: 120,
  cod_due: 1500,
  checkout_source: "cart",
  ecommerce: { value: 1500, shipping: 120, items: [{ item_id: "product", item_name: "Shirt", price: 1500, quantity: 1 }] },
};

function retryButton() {
  return screen.getByRole("button", { name: /Retry .* payment/ });
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function RefreshGate({ promise }: { promise: Promise<void> | null }) {
  if (promise) use(promise);
  return null;
}

// Suspend an update inside the component's real transition to verify that the
// previous result remains visible and pending until the server update is ready.
function RefreshHarness({ result, gate }: { result: PaymentResult; gate: Promise<void> }) {
  const [promise, setPromise] = useState<Promise<void> | null>(null);
  mocks.refresh.mockImplementation(() => setPromise(gate));
  return (
    <Suspense fallback={<p>Loading result</p>}>
      <PaymentResultClient result={result} />
      <RefreshGate promise={promise} />
    </Suspense>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState(null, "", "/payment/result?reference=test-reference");
  mocks.track.mockReturnValue(true);
  mocks.retry.mockResolvedValue({ data: { state: "processing" } });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("payment refresh", () => {
  it("keeps the reference and links, announces pending, and blocks repeated refresh and retry", async () => {
    const gate = deferred<void>();
    render(<RefreshHarness result={{ ...pending, retry_token: "pending-token" }} gate={gate.promise} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    });
    const checking = screen.getByRole("button", { name: "Checking..." });
    expect(checking.getAttribute("aria-busy")).toBe("true");
    expect(checking.hasAttribute("disabled")).toBe(true);
    expect(retryButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("link", { name: "Return to checkout" }).getAttribute("aria-disabled")).toBeNull();
    expect(window.location.search).toBe("?reference=test-reference");
    fireEvent.click(checking);
    fireEvent.click(retryButton());
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.retry).not.toHaveBeenCalled();
    await act(async () => gate.resolve());
    await waitFor(() => expect(screen.getByRole("button", { name: "Check again" }).hasAttribute("disabled")).toBe(false));
  });

  it("blocks refresh and repeated retries during retry and releases loading on rejection", async () => {
    const response = deferred<{ data: PaymentStartResult }>();
    mocks.retry.mockReturnValue(response.promise);
    render(<PaymentResultClient result={{ ...pending, retry_token: "token" }} />);
    fireEvent.click(retryButton());
    const retrying = screen.getByRole("button", { name: "Retrying..." });
    expect(retrying.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(retrying);
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(mocks.retry).toHaveBeenCalledTimes(1);
    expect(mocks.refresh).not.toHaveBeenCalled();
    await act(async () => response.reject(new Error("offline")));
    expect(mocks.error).toHaveBeenCalledWith("Payment retry failed.");
    expect(retryButton().hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "Check again" }).hasAttribute("disabled")).toBe(false);
  });

  it.each(["initiated", "verification_pending"] as const)("offers refresh for %s", (state) => {
    render(<PaymentResultClient result={{ ...pending, state }} />);
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it.each(["creating", "failed", "completed", "cancelled", "expired", "unavailable", "payment_create_failed"] as const)("does not offer refresh for %s", (state) => {
    render(<PaymentResultClient result={{ state, message: "Result" }} />);
    expect(screen.queryByRole("button", { name: "Check again" })).toBeNull();
  });
});

describe("retry token ownership", () => {
  it("uses the refreshed server token, then a failed retry's replacement", async () => {
    const view = render(<PaymentResultClient result={pending} />);
    view.rerender(<PaymentResultClient result={failed} />);
    mocks.retry.mockResolvedValueOnce({ data: { state: "failed", message: "Try again", retry_token: "replacement" } });
    fireEvent.click(retryButton());
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Try again"));
    fireEvent.click(retryButton());
    await waitFor(() => expect(mocks.retry).toHaveBeenLastCalledWith("replacement"));
    expect(mocks.retry).toHaveBeenNthCalledWith(1, "server-token");
  });

  it("supersedes a local token with a same-state server result and removes retry without a token", async () => {
    const view = render(<PaymentResultClient result={failed} />);
    mocks.retry.mockResolvedValueOnce({ data: { state: "failed", message: "Failed", retry_token: "replacement" } });
    fireEvent.click(retryButton());
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    view.rerender(<PaymentResultClient result={{ ...failed, retry_token: "new-server-token" }} />);
    fireEvent.click(retryButton());
    await waitFor(() => expect(mocks.retry).toHaveBeenLastCalledWith("new-server-token"));
    view.rerender(<PaymentResultClient result={{ ...failed, retry_token: undefined }} />);
    expect(screen.queryByRole("button", { name: /Retry .* payment/ })).toBeNull();
  });

  it.each(["new-server-token", undefined])("ignores a late replacement after the server token changes to %s", async (token) => {
    const response = deferred<{ data: PaymentStartResult }>();
    mocks.retry.mockReturnValueOnce(response.promise);
    const view = render(<PaymentResultClient result={failed} />);
    fireEvent.click(retryButton());
    view.rerender(<PaymentResultClient result={{ ...failed, retry_token: token }} />);
    await act(async () => response.resolve({ data: { state: "failed", message: "Late failure", retry_token: "stale" } }));
    if (token) {
      fireEvent.click(retryButton());
      await waitFor(() => expect(mocks.retry).toHaveBeenLastCalledWith(token));
    } else {
      expect(screen.queryByRole("button", { name: /Retry .* payment/ })).toBeNull();
    }
  });
});

describe("completion and continuation", () => {
  it.each(["cart", "buy_now"] as const)("clears only %s and its key before deduplicated tracking", (source) => {
    mocks.track.mockImplementation(() => {
      expect(window.location.search).toBe("");
      expect(mocks.enableAnalytics).toHaveBeenCalled();
      return true;
    });
    const result = { ...completed, checkout_source: source };
    const view = render(<PaymentResultClient result={pending} />);
    view.rerender(<PaymentResultClient result={result} />);
    expect(mocks.clearCart).toHaveBeenCalledTimes(source === "cart" ? 1 : 0);
    expect(mocks.clearBuyNow).toHaveBeenCalledTimes(source === "buy_now" ? 1 : 0);
    expect(mocks.clearKey).toHaveBeenCalledExactlyOnceWith(source);
    expect(mocks.track).toHaveBeenCalledWith({ transaction_id: completed.order_number, ...completed.ecommerce });
    view.rerender(<PaymentResultClient result={{ ...result, ecommerce: { ...completed.ecommerce! } }} />);
    expect(mocks.track).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Track order" }).getAttribute("href")).toBe("/orders");
    expect(screen.getByRole("link", { name: "Sign in to Orders" }).getAttribute("href")).toBe("/account/login?next=%2Faccount%2Forders");
    expect(screen.getByRole("link", { name: "Continue shopping" }).getAttribute("href")).toBe("/products");
  });

  it("tracks again only when an earlier event was not accepted", () => {
    mocks.track.mockReturnValueOnce(false).mockReturnValue(true);
    const view = render(<PaymentResultClient result={completed} />);
    view.rerender(<PaymentResultClient result={{ ...completed, ecommerce: { ...completed.ecommerce! } }} />);
    expect(mocks.track).toHaveBeenCalledTimes(2);
    view.rerender(<PaymentResultClient result={{ ...completed, ecommerce: { ...completed.ecommerce! } }} />);
    expect(mocks.track).toHaveBeenCalledTimes(2);
  });

  it("preserves both stores and the reference for an unavailable result", () => {
    render(<PaymentResultClient result={{ state: "unavailable", message: "Unavailable" }} />);
    expect(mocks.clearCart).not.toHaveBeenCalled();
    expect(mocks.clearBuyNow).not.toHaveBeenCalled();
    expect(mocks.clearKey).not.toHaveBeenCalled();
    expect(mocks.track).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?reference=test-reference");
    expect(screen.queryByText("Track this order")).toBeNull();
  });

  it("shows API errors and releases loading", async () => {
    mocks.retry.mockRejectedValue(new ApiError("Token expired", 400));
    render(<PaymentResultClient result={failed} />);
    fireEvent.click(retryButton());
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Token expired"));
    expect(retryButton().hasAttribute("disabled")).toBe(false);
  });

  it("rejects contract mismatches without consuming a replacement token", async () => {
    mocks.retry.mockResolvedValue({ data: { state: "failed", message: "Wrong amount", retry_token: "wrong", payment_contract_version: 2, payment_method: "cod", pay_now_amount: 1 } });
    render(<PaymentResultClient result={{ ...failed, payment_method: "cod", pay_now_amount: 120 }} />);
    fireEvent.click(retryButton());
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining("did not match this Order")));
    fireEvent.click(retryButton());
    await waitFor(() => expect(mocks.retry).toHaveBeenCalledTimes(2));
    expect(mocks.retry).toHaveBeenLastCalledWith("server-token");
  });

  it.each([
    [{ state: "redirect", bkash_url: "https://sandbox.bka.sh/pay" }, "https://sandbox.bka.sh/pay"],
    [{ state: "completed", reference: "new reference" }, "/payment/result?reference=new%20reference"],
  ] satisfies Array<[PaymentStartResult, string]>)("continues a %j response", async (next, destination) => {
    render(<PaymentResultClient result={failed} />);
    const originalWindow = window;
    vi.stubGlobal("window", new Proxy(originalWindow, {
      get(target, property) {
        return property === "location" ? { assign: mocks.assign } : Reflect.get(target, property);
      },
    }));
    mocks.retry.mockResolvedValue({ data: next });
    fireEvent.click(retryButton());
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledWith(destination));
  });

  it("keeps the buy-now return link and processing feedback", async () => {
    render(<PaymentResultClient result={{ ...failed, checkout_source: "buy_now" }} />);
    expect(screen.getByRole("link", { name: "Return to checkout" }).getAttribute("href")).toBe("/checkout/buy-now");
    fireEvent.click(retryButton());
    await waitFor(() => expect(mocks.info).toHaveBeenCalledWith(expect.stringContaining("being prepared")));
  });
});
