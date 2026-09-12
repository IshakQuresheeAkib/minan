import {
  renderToReadableStream,
  renderToStaticMarkup,
} from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCachedProductFilterOptionsMock,
  getCachedProductsMock,
  preloadMock,
} = vi.hoisted(() => ({
    getCachedProductFilterOptionsMock: vi.fn(),
    getCachedProductsMock: vi.fn(),
    preloadMock: vi.fn(),
  }));

vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  preload: preloadMock,
}));

vi.mock("@/features/products/components/ProductCatalog", () => ({
  ProductCatalog: () => null,
}));

vi.mock("@/features/products/services/product.cache", () => ({
  getCachedProductFilterOptions: getCachedProductFilterOptionsMock,
  getCachedProducts: getCachedProductsMock,
}));

import ProductsPage, { generateMetadata } from "./page";

const defaultImageUrl = "https://example.com/default-product.webp";
const filteredImageUrl = "https://example.com/filtered-product.webp";

function productList(imageUrl: string) {
  return {
    data: [
      {
        _id: "product-1",
        name: "Product",
        slug: "product",
        price: 1000,
        discount: 0,
        discounted_price: 1000,
        images: [imageUrl],
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    hasMore: false,
  };
}

async function renderRequestedProductsPage(
  searchParams: Promise<{ search?: string }>,
) {
  const page = await ProductsPage({ searchParams });
  const stream = await renderToReadableStream(page);
  await stream.allReady;
  await new Response(stream).text();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("products metadata", () => {
  it("defines route-specific Open Graph and Twitter sharing metadata", async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({}),
    });

    expect(metadata.openGraph).toMatchObject({
      url: "/products",
      images: [
        expect.objectContaining({
          url: "/hero/limited-offer.webp",
          alt: expect.stringContaining("MINAN"),
        }),
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/hero/limited-offer.webp"],
    });
  });
});

describe("products catalog image preload", () => {
  it("preloads only the first product matching the request filters", async () => {
    getCachedProductsMock.mockImplementation(
      async (options: { search?: string }) =>
        productList(options.search ? filteredImageUrl : defaultImageUrl),
    );
    getCachedProductFilterOptionsMock.mockResolvedValue({
      categories: [],
      colors: [],
      sizes: [],
      price: { min: 0, max: 0 },
    });

    await renderRequestedProductsPage(Promise.resolve({ search: "linen" }));

    expect(getCachedProductsMock).toHaveBeenCalledTimes(1);
    expect(preloadMock).toHaveBeenCalledTimes(1);
    expect(preloadMock).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(filteredImageUrl)),
      expect.objectContaining({ as: "image", fetchPriority: "high" }),
    );
  });
});

describe("products loading frame", () => {
  it("streams the requested search heading while catalog data is pending", async () => {
    getCachedProductsMock.mockReturnValue(new Promise(() => undefined));
    getCachedProductFilterOptionsMock.mockResolvedValue({
      categories: [],
      colors: [],
      sizes: [],
      price: { min: 0, max: 0 },
    });

    const page = await ProductsPage({
      searchParams: Promise.resolve({ search: "linen" }),
    });
    const initialMarkup = renderToStaticMarkup(page);

    expect(initialMarkup).toContain("Search results for &quot;linen&quot;");
    expect(initialMarkup).not.toContain(">Products</h1>");
  });
});
