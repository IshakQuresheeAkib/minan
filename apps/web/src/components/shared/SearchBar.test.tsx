// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchBar } from "./SearchBar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("SearchBar component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders in admin variant with always-open input and admin placeholder", () => {
    render(<SearchBar variant="admin" alwaysOpen />);

    const input = screen.getByRole("searchbox", { name: "Search catalog products" });
    expect(input).toBeDefined();
    expect(input.getAttribute("placeholder")).toBe("Search catalog products...");
    // Should have expanded text styles rather than transparent text
    expect(input.className).toContain("text-neutral-800");
  });

  it("submits the query via onSearchSubmit in admin variant", () => {
    const handleSearchSubmit = vi.fn();
    render(
      <SearchBar
        variant="admin"
        alwaysOpen
        initialQuery="Panjabi"
        onSearchSubmit={handleSearchSubmit}
      />,
    );

    const input = screen.getByRole("searchbox", { name: "Search catalog products" });
    expect((input as HTMLInputElement).value).toBe("Panjabi");

    const form = screen.getByRole("search", { name: "Catalog product search" });
    fireEvent.submit(form);

    expect(handleSearchSubmit).toHaveBeenCalledWith("Panjabi");
  });

  it("shows clear button when query is present in admin mode and clears input on click", () => {
    render(<SearchBar variant="admin" alwaysOpen initialQuery="Shirt" />);

    const input = screen.getByRole("searchbox", { name: "Search catalog products" }) as HTMLInputElement;
    expect(input.value).toBe("Shirt");

    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    expect(clearBtn).toBeDefined();

    fireEvent.click(clearBtn);
    expect(input.value).toBe("");
  });

  it("remains open and visible on escape in alwaysOpen mode", () => {
    render(<SearchBar variant="admin" alwaysOpen initialQuery="Linen" />);

    const input = screen.getByRole("searchbox", { name: "Search catalog products" }) as HTMLInputElement;
    fireEvent.keyDown(window, { key: "Escape" });

    // In alwaysOpen mode, the input remains fully expanded and query is preserved
    expect(input.className).toContain("text-neutral-800");
    expect(input.value).toBe("Linen");
  });
});
