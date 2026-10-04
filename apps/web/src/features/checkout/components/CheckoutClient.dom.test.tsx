// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn(), start: vi.fn(), quoteSettled: false, track: vi.fn() }));
vi.mock("@/lib/api/client", async (original) => ({
  ...await original<typeof import("@/lib/api/client")>(), apiRequest: mocks.apiRequest,
}));
vi.mock("@/features/checkout/actions/checkout.actions", () => ({ startCheckoutPayment: mocks.start, retryCheckoutPayment: vi.fn() }));
vi.mock("@/features/products/hooks/useCartPricingSync", () => ({ useCartPricingSync: vi.fn() }));
vi.mock("@/lib/analytics/ga4", () => ({ toGa4Item: vi.fn(), trackGa4CommerceEvent: mocks.track }));
import { CheckoutClient } from "./CheckoutClient";
import { useCartStore } from "@/store/cart.store";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

const config = { delivery_fee: 100, currency: "BDT", refundable: false };
beforeEach(() => {
  vi.clearAllMocks();
  useCustomerAuthStore.getState().clearSession();
  useCartStore.setState({ hasHydrated: true, items: [{
    lineId: "one", productId: "product", name: "Shirt", slug: "shirt", price: 100,
    originalPrice: 100, discount: 0, imageUrl: "", size: "M", color: "Black", quantity: 1, isAvailable: true,
  }] });
});
afterEach(cleanup);
function mount() {
  return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><CheckoutClient /></SWRConfig>);
}
describe("checkout configuration loading", () => {
  it("keeps typed delivery fields and blocks Enter while options are pending", async () => {
    let resolveConfig: (value: { data: typeof config }) => void = () => undefined;
    mocks.apiRequest.mockReturnValue(new Promise((resolve) => { resolveConfig = resolve; }));
    mount();
    const name = screen.getByLabelText("Name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Test Buyer" } });
    fireEvent.change(screen.getByLabelText("Phone Number"), { target: { value: "01712345678" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Detailed Address"), { target: { value: "Synthetic test address" } });
    await act(async () => fireEvent.submit(name.closest("form")!));
    expect(mocks.start).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Loading delivery and payment options")).toBeTruthy();
    await act(async () => resolveConfig({ data: config }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Pay Tk 100/ }).hasAttribute("disabled")).toBe(false));
    expect(screen.getByLabelText("Name")).toBe(name);
    expect(name.value).toBe("Test Buyer");
  });

  it("retries a configuration failure without clearing delivery details", async () => {
    mocks.apiRequest.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce({ data: config });
    mount();
    const name = screen.getByLabelText("Name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Test Buyer" } });
    await screen.findByRole("button", { name: "Retry checkout pricing" });
    fireEvent.click(screen.getByRole("button", { name: "Retry checkout pricing" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Retry checkout pricing" })).toBeNull());
    expect(screen.getByLabelText("Name")).toBe(name);
    expect(name.value).toBe("Test Buyer");
  });
});
