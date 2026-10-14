"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";

import { fetchAdminCategories } from "@/features/admin/actions/categories.actions";
import { fetchAdminSubcategories } from "@/features/admin/actions/subcategories.actions";
import { type AdminProductStatusFilter } from "@/features/admin/actions/products.actions";
import { useAdminProducts } from "@/features/admin/hooks/useAdminProducts";
import { ProductsTable } from "@/features/admin/components/ProductsTable";
import type { ProductForm as ProductFormType } from "@/features/admin/components/ProductForm";

const ProductForm = dynamic<ComponentProps<typeof ProductFormType>>(
  () =>
    import("@/features/admin/components/ProductForm").then(
      (mod) => mod.ProductForm,
    ),
  { ssr: false },
);
import type {
  AdminCategory,
  AdminProduct,
  AdminSubcategory,
} from "@/features/admin/types";
import { adminRoutes } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

const PAGE_LIMIT = 20;

export type AdminProductAppliedFilters = {
  page: number;
  search: string;
  categoryId: string;
  status: AdminProductStatusFilter;
};

type ProductFilterDraft = Pick<
  AdminProductAppliedFilters,
  "search" | "categoryId" | "status"
>;

type AdminProductsProps = {
  appliedFilters: AdminProductAppliedFilters;
};

function getFilterDraft(
  appliedFilters: AdminProductAppliedFilters,
): ProductFilterDraft {
  return {
    search: appliedFilters.search,
    categoryId: appliedFilters.categoryId,
    status: appliedFilters.status,
  };
}

function getFilterDraftKey(filterDraft: ProductFilterDraft): string {
  return JSON.stringify([
    filterDraft.search,
    filterDraft.categoryId,
    filterDraft.status,
  ]);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function buildProductsPath(filters: AdminProductAppliedFilters): string {
  const params = new URLSearchParams();
  const search = filters.search.trim();
  const categoryId = filters.categoryId.trim();

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (search) {
    params.set("search", search);
  }

  if (categoryId) {
    params.set("category_id", categoryId);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return query ? `${adminRoutes.products}?${query}` : adminRoutes.products;
}

export function AdminProducts({ appliedFilters }: AdminProductsProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const appliedFilterDraft = getFilterDraft(appliedFilters);
  const appliedFilterDraftKey = getFilterDraftKey(appliedFilterDraft);
  const {
    products,
    total,
    totalPages,
    loading,
    error,
    mutate: mutateProducts,
  } = useAdminProducts({
    page: appliedFilters.page,
    limit: PAGE_LIMIT,
    search: appliedFilters.search,
    categoryId: appliedFilters.categoryId,
    status: appliedFilters.status,
  });

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [filterDraftState, setFilterDraftState] = useState(() => ({
    appliedKey: appliedFilterDraftKey,
    draft: appliedFilterDraft,
  }));
  const filterDraft =
    filterDraftState.appliedKey === appliedFilterDraftKey
      ? filterDraftState.draft
      : appliedFilterDraft;

  useEffect(() => {
    const categoryAccessToken = accessToken;

    if (!categoryAccessToken) {
      return;
    }

    let cancelled = false;

    async function loadClassifications(token: string) {
      await Promise.resolve();

      if (cancelled) {
        return;
      }

      setCategoriesLoading(true);
      setCategoriesError(null);

      try {
        const [categoryResponse, subcategoryResponse] = await Promise.all([
          fetchAdminCategories(token),
          fetchAdminSubcategories(token),
        ]);
        if (!cancelled) {
          setCategories(categoryResponse.data);
          setSubcategories(subcategoryResponse.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setCategoriesError(
            getErrorMessage(
              loadError,
              "Failed to load product classifications.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    }

    void loadClassifications(categoryAccessToken);

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const navigateWithFilters = useCallback(
    (filters: AdminProductAppliedFilters) => {
      router.push(buildProductsPath(filters));
    },
    [router],
  );

  const handleFilterDraftChange = useCallback(
    (draft: ProductFilterDraft) => {
      setFilterDraftState({
        appliedKey: appliedFilterDraftKey,
        draft,
      });
    },
    [appliedFilterDraftKey],
  );

  const handleApplyFilters = useCallback(() => {
    navigateWithFilters({
      page: 1,
      search: filterDraft.search.trim(),
      categoryId: filterDraft.categoryId.trim(),
      status: filterDraft.status,
    });
  }, [filterDraft, navigateWithFilters]);

  const handleClearFilters = useCallback(() => {
    const draft: ProductFilterDraft = {
      search: "",
      categoryId: "",
      status: "all",
    };

    setFilterDraftState({
      appliedKey: appliedFilterDraftKey,
      draft,
    });
    navigateWithFilters({
      page: 1,
      search: "",
      categoryId: "",
      status: "all",
    });
  }, [appliedFilterDraftKey, navigateWithFilters]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      navigateWithFilters({
        ...appliedFilters,
        page: Math.max(1, nextPage),
      });
    },
    [appliedFilters, navigateWithFilters],
  );

  const handleChanged = useCallback(() => {
    void mutateProducts();
  }, [mutateProducts]);

  return (
    <>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : "Failed to load products."}
        </p>
      ) : null}

      <ProductsTable
        accessToken={accessToken ?? ""}
        products={products}
        categories={categories}
        subcategories={subcategories}
        loading={loading}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        filterDraft={filterDraft}
        page={appliedFilters.page}
        totalPages={totalPages}
        total={total}
        limit={PAGE_LIMIT}
        onFilterDraftChange={handleFilterDraftChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onPageChange={handlePageChange}
        onChanged={handleChanged}
        onCreate={() => {
          setEditingProduct(null);
          setFormOpen(true);
        }}
        onEdit={(product) => {
          setEditingProduct(product);
          setFormOpen(true);
        }}
      />

      {accessToken && formOpen ? (
        <ProductForm
          accessToken={accessToken}
          categories={categories}
          subcategories={subcategories}
          open={formOpen}
          product={editingProduct}
          onOpenChange={(nextOpen) => {
            setFormOpen(nextOpen);
            if (!nextOpen) {
              setEditingProduct(null);
            }
          }}
          onSaved={handleChanged}
        />
      ) : null}
    </>
  );
}
