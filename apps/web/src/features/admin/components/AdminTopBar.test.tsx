// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminTopBar } from "./AdminTopBar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/admin",
}));

vi.mock("@/features/admin/components/OrdersNotificationProvider", () => ({
  useOrdersNotifications: () => ({
    unreadCount: 2,
  }),
}));

describe("AdminTopBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the reusable SearchBar always open with the admin catalog search placeholder", () => {
    render(<AdminTopBar />);

    expect(screen.getByText("Dashboard")).toBeDefined();

    const searchInput = screen.getByRole("searchbox", {
      name: "Search catalog products",
    });
    expect(searchInput).toBeDefined();
    expect(searchInput.getAttribute("placeholder")).toBe("Search catalog products...");
    // Check that input is always open (not collapsed text-transparent)
    expect(searchInput.className).toContain("text-neutral-800");
  });
});
