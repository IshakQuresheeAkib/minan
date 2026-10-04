// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getProducts: vi.fn() }));
vi.mock("@/features/products/services/product.service", () => ({ getProducts: mocks.getProducts }));
import { useProducts } from "./useProducts";

function page(id: string, currentPage = 1, hasMore = true) {
  return {
    data: [{ _id: id, name: id, slug: id, price: 100, discount: 0, discounted_price: 100, images: [] }],
    total: 2, page: currentPage, limit: 20, hasMore,
  };
}
function session() {
  const cache = new Map();
  return ({ children }: { children: ReactNode }) => <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>{children}</SWRConfig>;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => vi.clearAllMocks());

describe("catalog session cache", () => {
  it("seeds server data, loads only the next page, and restores all pages on revisit", async () => {
    const wrapper = session();
    const initialData = page("first");
    mocks.getProducts.mockResolvedValue(page("second", 2, false));
    const first = renderHook(() => useProducts({ initialData }), { wrapper });
    await act(async () => undefined);
    expect(mocks.getProducts).not.toHaveBeenCalled();
    await act(async () => first.result.current.loadMore());
    await waitFor(() => expect(first.result.current.products).toHaveLength(2));
    expect(mocks.getProducts).toHaveBeenCalledTimes(1);
    expect(mocks.getProducts).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 20 }));
    first.unmount();
    const revisit = renderHook(() => useProducts({ initialData }), { wrapper });
    expect(revisit.result.current.products.map((product) => product._id)).toEqual(["first", "second"]);
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(mocks.getProducts).toHaveBeenCalledTimes(1);
  });

  it("separates filter results and restores a previously visited filter", async () => {
    const wrapper = session();
    const a = page("a", 1, false);
    const b = page("b", 1, false);
    const hook = renderHook(({ category, initialData }) => useProducts({ category, initialData }), {
      wrapper, initialProps: { category: "a", initialData: a },
    });
    await act(async () => undefined);
    hook.rerender({ category: "b", initialData: b });
    await waitFor(() => expect(hook.result.current.products[0]?._id).toBe("b"));
    hook.rerender({ category: "a", initialData: a });
    await waitFor(() => expect(hook.result.current.products[0]?._id).toBe("a"));
    expect(mocks.getProducts).not.toHaveBeenCalled();
  });

  it("paginates new filters while an old request is pending and keeps their requests isolated", async () => {
    let resolveA: (value: ReturnType<typeof page>) => void = () => undefined;
    let resolveB: (value: ReturnType<typeof page>) => void = () => undefined;
    mocks.getProducts
      .mockReturnValueOnce(new Promise((resolve) => { resolveA = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveB = resolve; }));
    const hook = renderHook(({ category, initialData }) => useProducts({ category, initialData }), {
      wrapper: session(), initialProps: { category: "a", initialData: page("a-first") },
    });
    await act(async () => undefined);
    await act(async () => hook.result.current.loadMore());
    expect(mocks.getProducts).toHaveBeenCalledTimes(1);

    hook.rerender({ category: "b", initialData: page("b-first") });
    await waitFor(() => expect(hook.result.current.products[0]?._id).toBe("b-first"));
    expect(hook.result.current.isLoading).toBe(false);
    await act(async () => {
      hook.result.current.loadMore();
      hook.result.current.loadMore();
    });
    expect(mocks.getProducts).toHaveBeenCalledTimes(2);
    expect(mocks.getProducts).toHaveBeenLastCalledWith(expect.objectContaining({ category: ["b"], page: 2 }));

    await act(async () => resolveA(page("a-second", 2, false)));
    expect(hook.result.current.products.map((product) => product._id)).toEqual(["b-first"]);
    await act(async () => hook.result.current.loadMore());
    expect(mocks.getProducts).toHaveBeenCalledTimes(2);
    await act(async () => resolveB(page("b-second", 2, false)));
    await waitFor(() => expect(hook.result.current.products.map((product) => product._id)).toEqual(["b-first", "b-second"]));
  });

  it("keeps cached cards on an expired refresh failure and allows retry", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const initialData = page("cached", 1, false);
    const hook = renderHook(() => useProducts({ initialData }), { wrapper: session() });
    await act(async () => undefined);
    now.mockReturnValue(1_300_001);
    mocks.getProducts.mockRejectedValueOnce(new Error("Offline"));
    await act(async () => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(hook.result.current.error).toBe("Offline"));
    expect(hook.result.current.products[0]?._id).toBe("cached");
    mocks.getProducts.mockResolvedValueOnce(page("updated", 1, false));
    await act(async () => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.products[0]?._id).toBe("updated"));
    now.mockRestore();
  });

  it("refreshes all loaded pages together when ordering changes", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const initialData = page("old-first");
    mocks.getProducts.mockResolvedValueOnce(page("old-second", 2, false));
    const hook = renderHook(() => useProducts({ initialData }), { wrapper: session() });
    await act(async () => undefined);
    await act(async () => hook.result.current.loadMore());
    await waitFor(() => expect(hook.result.current.products).toHaveLength(2));
    let resolveFirst: (value: ReturnType<typeof page>) => void = () => undefined;
    mocks.getProducts.mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }));
    mocks.getProducts.mockResolvedValueOnce(page("new-second", 2, false));
    now.mockReturnValue(1_300_001);
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(hook.result.current.products.map((product) => product._id)).toEqual(["old-first", "old-second"]);
    await act(async () => resolveFirst(page("new-first")));
    await waitFor(() => expect(hook.result.current.products.map((product) => product._id)).toEqual(["new-first", "new-second"]));
    expect(mocks.getProducts).toHaveBeenCalledTimes(3);
  });

  it("retains the first page when pagination fails and retries the missing page", async () => {
    mocks.getProducts.mockRejectedValueOnce(new Error("Page unavailable"));
    const initialData = page("first");
    const hook = renderHook(() => useProducts({ initialData }), { wrapper: session() });
    await act(async () => undefined);
    await act(async () => hook.result.current.loadMore());
    await waitFor(() => expect(hook.result.current.error).toBe("Page unavailable"));
    expect(hook.result.current.products.map((product) => product._id)).toEqual(["first"]);
    mocks.getProducts.mockResolvedValueOnce(page("first")).mockResolvedValueOnce(page("second", 2, false));
    await act(async () => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.products.map((product) => product._id)).toEqual(["first", "second"]));
  });
});
