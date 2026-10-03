import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  data: undefined as unknown,
  error: undefined as unknown,
  isLoading: false,
  isValidating: false,
  size: 1,
  setSize: vi.fn(),
  mutate: vi.fn(),
}));
const authState = vi.hoisted(() => ({
  clearSession: vi.fn(),
  session: {
    accessToken: "customer-token",
    customer: { email: "buyer@example.com", id: "customer-1", is_active: true },
  },
  status: "authenticated",
}));
const buttonHandlers = vi.hoisted(() => ({
  retry: null as null | (() => void),
}));

vi.mock("swr/infinite", () => ({
  default: () => mockState,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick?: () => void;
  }) => {
    if (children === "Retry") buttonHandlers.retry = onClick ?? null;
    return createElement("button", { onClick }, children);
  },
}));

vi.mock("@/features/order-tracking/lib/customerSession", () => ({
  restoreCustomerSession: vi.fn(),
}));

vi.mock("@/features/order-tracking/lib/orderTrackingApi", () => ({
  logoutCustomer: vi.fn(),
}));

vi.mock("@/store/customer-auth.store", () => ({
  useCustomerAuthStore: () => authState,
}));

import type { CustomerOrderHistoryPage } from "@/features/order-tracking/lib/types";
import { CustomerOrderHistoryPageError } from "@/features/order-tracking/lib/customerOrderHistorySWR";

import { CustomerOrderHistory } from "./CustomerOrderHistory";

describe("CustomerOrderHistory", () => {
  afterEach(() => {
    mockState.data = undefined;
    mockState.error = undefined;
    mockState.isLoading = false;
    mockState.isValidating = false;
    mockState.size = 1;
    mockState.setSize.mockReset();
    mockState.mutate.mockReset();
    buttonHandlers.retry = null;
  });

  it("keeps loaded Orders visible and retries a failed cursor page", () => {
    const page: CustomerOrderHistoryPage = {
      next_cursor: "opaque-cursor-123456",
      orders: [
        {
          created_at: "2026-09-25T10:00:00.000Z",
          current_stage: {
            code: "processing",
            helper_text_bn: "আপনার অর্ডার প্রস্তুত করা হচ্ছে।",
            label: "Processing",
          },
          expected_delivery_date: null,
          first_item: { image_url: null, name: "Shirt" },
          order_id: "MN-20260925-0001",
          overall_order_value: 1200,
          total_item_quantity: 1,
        },
      ],
    };
    mockState.data = [page];
    mockState.error = new CustomerOrderHistoryPageError(
      "opaque-cursor-123456",
      new Error("Cursor request failed"),
    );
    mockState.size = 2;

    const markup = renderToStaticMarkup(createElement(CustomerOrderHistory));

    expect(markup).toContain("MN-20260925-0001");
    expect(markup).toContain("Failed to load additional Orders.");
    buttonHandlers.retry?.();
    expect(mockState.setSize).toHaveBeenCalledWith(2);
  });
});
