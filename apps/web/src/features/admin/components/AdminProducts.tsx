"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchAdminCategories } from "@/features/admin/actions/categories.actions";
import { fetchAdminSubcategories } from "@/features/admin/actions/subcategories.actions";
import {
  fetchAdminProducts,
  type AdminProductStatusFilter,
} from "@/features/admin/actions/products.actions";
import { ProductForm } from "@/features/admin/components/ProductForm";
import { ProductsTable } from "@/features/admin/components/ProductsTable";
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
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [filterDraftState, setFilterDraftState] = useState(() => ({
    appliedKey: appliedFilterDraftKey,
    draft: appliedFilterDraft,
  }));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const filterDraft =
    filterDraftState.appliedKey === appliedFilterDraftKey
      ? filterDraftState.draft
      : appliedFilterDraft;

  const loadProducts = useCallback(
    async (
      filters: AdminProductAppliedFilters,
      isCurrent: () => boolean = () => true,
    ) => {
      if (!accessToken) {
        if (isCurrent()) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetchAdminProducts(accessToken, {
          page: filters.page,
          limit: PAGE_LIMIT,
          search: filters.search,
          categoryId: filters.categoryId,
          status: filters.status,
        });

        if (!isCurrent()) {
          return;
        }

        setProducts(response.data);
        setTotal(response.total);
        setTotalPages(Math.max(1, Math.ceil(response.total / response.limit)));
      } catch (loadError) {
        if (isCurrent()) {
          setError(getErrorMessage(loadError, "Failed to load products."));
        }
      } finally {
        if (isCurrent()) {
          setLoading(false);
        }
      }
    },
    [accessToken],
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await Promise.resolve();
      await loadProducts(appliedFilters, () => !cancelled);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters, loadProducts]);

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
    void loadProducts(appliedFilters);
  }, [appliedFilters, loadProducts]);

  return (
    <>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
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

      {accessToken ? (
        <ProductForm
          accessToken={accessToken}
          open={formOpen}
          product={editingProduct}
          onOpenChange={setFormOpen}
          onSaved={handleChanged}
        />
      ) : null}
    </>
  );
}
