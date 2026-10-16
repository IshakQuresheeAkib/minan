// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminCategory, AdminSubcategory } from "@/features/admin/types";

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
  {
    _id: "cat_2",
    name: "Bottoms",
    slug: "bottoms",
    image_url: "https://example.com/bottoms.jpg",
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
  {
    _id: "sub_2",
    category_id: "cat_2",
    category: { name: "Bottoms", slug: "bottoms" },
    name: "Jeans",
    slug: "jeans",
    display_order: 1,
    is_active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const fetchCategoriesMock = vi.fn();
const fetchSubcategoriesMock = vi.fn();

vi.mock("@/features/admin/actions/categories.actions", () => ({
  fetchAdminCategories: (...args: unknown[]) => fetchCategoriesMock(...args),
}));

vi.mock("@/features/admin/actions/subcategories.actions", () => ({
  fetchAdminSubcategories: (...args: unknown[]) => fetchSubcategoriesMock(...args),
}));

vi.mock("@/features/admin/actions/products.actions", () => ({
  createAdminProduct: vi.fn(),
  updateAdminProduct: vi.fn(),
  deleteUploadedImages: vi.fn(),
  fetchUploadSignature: vi.fn(),
}));

vi.mock("@/features/admin/components/ImageUploader", () => ({
  ImageUploader: () => <div data-testid="image-uploader" />,
}));

vi.mock("@/features/admin/components/RichTextEditor", () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import { ProductForm } from "./ProductForm";

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
});

describe("ProductForm classifications loading and fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("uses fetched classification options when opened with empty arrays before parent finishes loading", async () => {
    fetchCategoriesMock.mockResolvedValue({ data: mockCategories });
    fetchSubcategoriesMock.mockResolvedValue({ data: mockSubcategories });

    render(
      <ProductForm
        accessToken="test-token"
        open={true}
        product={null}
        categories={[]}
        subcategories={[]}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    // Fallback request should have been initiated
    expect(fetchCategoriesMock).toHaveBeenCalledWith("test-token");
    expect(fetchSubcategoriesMock).toHaveBeenCalledWith("test-token");

    // Click the Category trigger to view options
    const categoryTrigger = screen.getByRole("combobox", { name: "Category" });
    fireEvent.click(categoryTrigger);

    // The options from the fetched fallback classifications should be present in the document
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Tops" })).toBeDefined();
      expect(screen.getByRole("option", { name: "Bottoms" })).toBeDefined();
    });
  });

  it("uses fetched classification options when props are undefined", async () => {
    fetchCategoriesMock.mockResolvedValue({ data: mockCategories });
    fetchSubcategoriesMock.mockResolvedValue({ data: mockSubcategories });

    render(
      <ProductForm
        accessToken="test-token"
        open={true}
        product={null}
        categories={undefined}
        subcategories={undefined}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(fetchCategoriesMock).toHaveBeenCalledWith("test-token");
    expect(fetchSubcategoriesMock).toHaveBeenCalledWith("test-token");

    const categoryTrigger = screen.getByRole("combobox", { name: "Category" });
    fireEvent.click(categoryTrigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Tops" })).toBeDefined();
      expect(screen.getByRole("option", { name: "Bottoms" })).toBeDefined();
    });
  });

  it("does not trigger fallback requests when parent passes non-empty classifications", async () => {
    render(
      <ProductForm
        accessToken="test-token"
        open={true}
        product={null}
        categories={mockCategories}
        subcategories={mockSubcategories}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(fetchCategoriesMock).not.toHaveBeenCalled();
    expect(fetchSubcategoriesMock).not.toHaveBeenCalled();

    const categoryTrigger = screen.getByRole("combobox", { name: "Category" });
    fireEvent.click(categoryTrigger);

    expect(screen.getByRole("option", { name: "Tops" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Bottoms" })).toBeDefined();
  });

  it("does not trigger fallback requests when parent has categories but genuinely empty subcategories", async () => {
    render(
      <ProductForm
        accessToken="test-token"
        open={true}
        product={null}
        categories={mockCategories}
        subcategories={[]}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(fetchCategoriesMock).not.toHaveBeenCalled();
    expect(fetchSubcategoriesMock).not.toHaveBeenCalled();

    const categoryTrigger = screen.getByRole("combobox", { name: "Category" });
    fireEvent.click(categoryTrigger);

    expect(screen.getByRole("option", { name: "Tops" })).toBeDefined();
  });

  it("switches to parent classifications once non-empty parent data arrives", async () => {
    fetchCategoriesMock.mockResolvedValue({ data: mockCategories });
    fetchSubcategoriesMock.mockResolvedValue({ data: mockSubcategories });

    const { rerender } = render(
      <ProductForm
        accessToken="test-token"
        open={true}
        product={null}
        categories={[]}
        subcategories={[]}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const categoryTrigger = screen.getByRole("combobox", { name: "Category" });
    fireEvent.click(categoryTrigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Tops" })).toBeDefined();
    });

    const parentCategories: AdminCategory[] = [
      {
        _id: "parent_cat",
        name: "Parent Special Category",
        slug: "parent-special",
        image_url: "",
        is_active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    rerender(
      <ProductForm
        accessToken="test-token"
        open={true}
        product={null}
        categories={parentCategories}
        subcategories={[]}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Parent Special Category" })).toBeDefined();
    });
  });
});
