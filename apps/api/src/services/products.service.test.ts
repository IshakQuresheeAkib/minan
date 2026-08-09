import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  categoryFind: vi.fn(),
  productAggregate: vi.fn(),
  productDistinct: vi.fn(),
  subcategoryFind: vi.fn(),
}));

vi.mock("../models/Category.js", () => ({
  Category: { find: mocks.categoryFind },
}));

vi.mock("../models/Product.js", () => ({
  Product: {
    aggregate: mocks.productAggregate,
    distinct: mocks.productDistinct,
  },
}));

vi.mock("../models/Subcategory.js", () => ({
  Subcategory: { find: mocks.subcategoryFind },
}));

import { getProductFilterOptions } from "./products.service.js";

describe("getProductFilterOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only active categories referenced by active products", async () => {
    const populatedCategoryId = new Types.ObjectId();
    const categorySelect = vi.fn().mockResolvedValue([
      {
        _id: populatedCategoryId,
        name: "Panjabi",
        slug: "panjabi",
        image_url: "https://res.cloudinary.com/minan/panjabi.webp",
      },
    ]);
    const categorySort = vi.fn(() => ({ select: categorySelect }));
    const subcategorySelect = vi.fn().mockResolvedValue([]);
    const subcategorySort = vi.fn(() => ({ select: subcategorySelect }));

    mocks.categoryFind.mockReturnValue({ sort: categorySort });
    mocks.subcategoryFind.mockReturnValue({ sort: subcategorySort });
    mocks.productDistinct.mockImplementation((field: string) => {
      if (field === "category_id") {
        return Promise.resolve([populatedCategoryId]);
      }

      return Promise.resolve([]);
    });
    mocks.productAggregate.mockResolvedValue([]);

    const result = await getProductFilterOptions();

    expect(mocks.productDistinct).toHaveBeenCalledWith("category_id", {
      is_active: true,
    });
    expect(mocks.categoryFind).toHaveBeenCalledWith({
      _id: { $in: [populatedCategoryId] },
      is_active: true,
    });
    expect(result.data.categories).toEqual([
      {
        name: "Panjabi",
        slug: "panjabi",
        image_url: "https://res.cloudinary.com/minan/panjabi.webp",
        subcategories: [],
      },
    ]);
  });
});
