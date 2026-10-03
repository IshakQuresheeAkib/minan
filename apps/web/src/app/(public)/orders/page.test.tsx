import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const routerMocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

import OrderTrackingPage from "./page";

describe("OrderTrackingPage", () => {
  it("server-renders an order deep link in the public lookup form", async () => {
    const page = await OrderTrackingPage({
      searchParams: Promise.resolve({
        order: "  MN-20260910-0001  ",
      }),
    });

    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("Find an order update");
    expect(markup).toContain('value="MN-20260910-0001"');
    expect(markup).not.toContain("Sign in to view this order");
  });

  it("does not prefill a phone query into the public lookup form", async () => {
    const page = await OrderTrackingPage({
      searchParams: Promise.resolve({ order: "01712345678" }),
    });

    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("Find an order update");
    expect(markup).not.toContain("01712345678");
  });
});
