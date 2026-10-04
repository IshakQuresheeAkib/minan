// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { afterEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
  useSearchParams: () => new URLSearchParams(route.query),
}));
vi.mock("@/features/products/components/ProductCatalog", () => ({
  ProductCatalog: ({ initialData }: { initialData: { data: { name: string }[] } }) => <p>{initialData.data[0]?.name}</p>,
}));
import { ProductCatalogPending } from "./CachedProductCatalog";
import { catalogQuery } from "@/features/products/hooks/useProducts";

afterEach(cleanup);
describe("pending catalog route", () => {
  it("shows the matching cached catalog while the route is pending, and never another filter's cards", () => {
    const key = unstable_serialize(() => ["catalog-page", catalogQuery({}), 1]);
    const fallback = {
      [key]: [{ data: [{ name: "Cached shirt" }], page: 1, limit: 20, total: 1, hasMore: false, fetchedAt: 1 }],
      "catalog-filter-options": { categories: [], colors: [], sizes: [], price: { min: 0, max: 100 } },
    };
    route.query = "__proto__=ignored";
    const cache = new Map(Object.entries(fallback).map(([key, data]) => [key, { data }]));
    const view = render(<SWRConfig value={{ provider: () => cache }}><ProductCatalogPending /></SWRConfig>);
    expect(screen.getByText("Cached shirt")).toBeTruthy();
    expect(screen.queryByLabelText("Loading product catalog")).toBeNull();
    route.query = "search=different";
    view.rerender(<SWRConfig value={{ provider: () => cache }}><ProductCatalogPending /></SWRConfig>);
    expect(screen.queryByText("Cached shirt")).toBeNull();
    expect(screen.getByLabelText("Loading product catalog")).toBeTruthy();
  });
});
