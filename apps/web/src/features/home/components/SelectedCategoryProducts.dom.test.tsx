// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getProducts: vi.fn() }));
vi.mock("@/features/products/services/product.service", () => ({ getProducts: mocks.getProducts }));
vi.mock("@/features/home/components/ProductsSection", () => ({
  CategoryProductGrid: ({ group }: { group: { products: { data: { name: string }[] } } }) => <p>{group.products.data[0]?.name}</p>,
}));
import { SelectedCategoryProducts } from "./SelectedCategoryProducts";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe("selected category caching", () => {
  it("reuses visited categories and retains cards with retry on a stale refresh failure", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    mocks.getProducts.mockResolvedValueOnce({ data: [{ name: "Cached category shirt" }] });
    const cache = new Map();
    const category = { name: "Shirts", slug: "shirts", imageUrl: "https://example.com/shirts.jpg" };
    function view(visible: boolean) {
      return <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>{visible ? <SelectedCategoryProducts category={category} initialContent={<p>Preview</p>} /> : <p>All categories</p>}</SWRConfig>;
    }
    const mounted = render(view(true));
    await screen.findByText("Cached category shirt");
    mounted.rerender(view(false));
    mounted.rerender(view(true));
    expect(screen.getByText("Cached category shirt")).toBeTruthy();
    await act(async () => undefined);
    expect(mocks.getProducts).toHaveBeenCalledTimes(1);
    now.mockReturnValue(1_300_001);
    mocks.getProducts.mockRejectedValueOnce(new Error("Offline"));
    await act(async () => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy());
    expect(screen.getByText("Cached category shirt")).toBeTruthy();
  });
});
