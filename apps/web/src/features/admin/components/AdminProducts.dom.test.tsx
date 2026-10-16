// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminCategory, AdminSubcategory } from "@/features/admin/types";
import { useAuthStore } from "@/store/auth.store";

const mockCategories: AdminCategory[] = [
  {
    _id: "cat_1",
    name: "Tops",
    slug: "tops",
    image_url: "https://example.com/tops.jpg",
    is_active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const mockSubcategories: AdminSubcategory[] = [
  {
    _id: "sub_1",
    category_id: "cat_1",
    category: { name: "Tops", slug: "tops" },
    name: "Shirts",
    slug: "shirts",
    display_order: 1,
    is_active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

let capturedProductFormProps: Record<string, unknown> | null = null;

vi.mock("next/dynamic", () => ({
  default: () => {
    return function MockDynamicProductForm(props: Record<string, unknown>) {
      capturedProductFormProps = props;
      return <div data-testid="mock-product-form" />;
    };
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/features/admin/hooks/useAdminProducts", () => ({
  useAdminProducts: () => ({
    products: [],
    total: 0,
    totalPages: 1,
    loading: false,
    error: null,
    mutate: vi.fn(),
  }),
}));

let fetchCategoriesCallCount = 0;
let resolveCategoriesPromise: (val: { data: AdminCategory[] }) => void;
let resolveSubcategoriesPromise: (val: { data: AdminSubcategory[] }) => void;

vi.mock("@/features/admin/actions/categories.actions", () => ({
  fetchAdminCategories: () => {
    fetchCategoriesCallCount += 1;
    return new Promise((resolve) => {
      resolveCategoriesPromise = resolve;
    });
  },
}));

vi.mock("@/features/admin/actions/subcategories.actions", () => ({
  fetchAdminSubcategories: () =>
    new Promise((resolve) => {
      resolveSubcategoriesPromise = resolve;
    }),
}));

import { AdminProducts } from "./AdminProducts";

describe("AdminProducts classification props propagation to ProductForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCategoriesCallCount = 0;
    capturedProductFormProps = null;
    useAuthStore.setState({ accessToken: "mock-token" });
  });

  afterEach(() => {
    cleanup();
  });

  it("passes undefined categories and subcategories when form opens before classifications finish loading", async () => {
    render(
      <AdminProducts
        appliedFilters={{
          page: 1,
          search: "",
          categoryId: "",
          status: "all",
        }}
      />,
    );

    // Wait until fetchAdminCategories has been invoked in loadClassifications
    await waitFor(() => {
      expect(fetchCategoriesCallCount).toBe(1);
    });

    // Click "Add product" button
    const addButton = screen.getByRole("button", { name: /Add product/i });
    fireEvent.click(addButton);

    // ProductForm should be rendered
    expect(screen.getByTestId("mock-product-form")).toBeDefined();
    // Before classifications resolve, categories and subcategories must be undefined, not empty arrays
    expect(capturedProductFormProps?.categories).toBeUndefined();
    expect(capturedProductFormProps?.subcategories).toBeUndefined();

    // Now resolve the classifications
    await act(async () => {
      resolveCategoriesPromise({ data: mockCategories });
      resolveSubcategoriesPromise({ data: mockSubcategories });
    });

    // Once classifications resolve, ProductForm receives the populated arrays
    await waitFor(() => {
      expect(capturedProductFormProps?.categories).toEqual(mockCategories);
      expect(capturedProductFormProps?.subcategories).toEqual(mockSubcategories);
    });
  });
});
