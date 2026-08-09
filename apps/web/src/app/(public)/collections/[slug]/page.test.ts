import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connection: vi.fn(),
  getCachedProductFilterOptions: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: mocks.connection,
}));

vi.mock("@/features/products/services/product.cache", () => ({
  getCachedProductFilterOptions: mocks.getCachedProductFilterOptions,
  getCachedProducts: vi.fn(),
}));

import { generateMetadata } from "./page";

describe("collection metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connection.mockResolvedValue(undefined);
  });

  it("marks catalog access as request-time before fetching metadata", async () => {
    mocks.getCachedProductFilterOptions.mockRejectedValue(
      new Error("Catalog API unavailable"),
    );

    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "panjabi" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("Catalog API unavailable");

    expect(mocks.connection).toHaveBeenCalledOnce();
    expect(mocks.connection.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getCachedProductFilterOptions.mock.invocationCallOrder[0] ?? 0,
    );
  });
});
