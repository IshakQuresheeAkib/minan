"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchAdminCategories } from "@/features/admin/actions/categories.actions";
import { fetchAdminSubcategories } from "@/features/admin/actions/subcategories.actions";
import { CategoryForm } from "@/features/admin/components/CategoryForm";
import { CategoriesTable } from "@/features/admin/components/CategoriesTable";
import { SubcategoryForm } from "@/features/admin/components/SubcategoryForm";
import { SubcategoriesTable } from "@/features/admin/components/SubcategoriesTable";
import type { AdminCategory, AdminSubcategory } from "@/features/admin/types";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

export function AdminCategories() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null,
  );
  const [view, setView] = useState<"categories" | "subcategories">(
    "categories",
  );
  const [subcategoryFormOpen, setSubcategoryFormOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] =
    useState<AdminSubcategory | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const [categoryResponse, subcategoryResponse] = await Promise.all([
      fetchAdminCategories(accessToken),
      fetchAdminSubcategories(accessToken),
    ]);
    setCategories(categoryResponse.data);
    setSubcategories(subcategoryResponse.data);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError(null);

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
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Failed to load categories.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleChanged = useCallback(() => {
    void reload().catch((loadError: unknown) => {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load categories.",
      );
    });
  }, [reload]);

  return (
    <div>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className="mb-6 inline-flex rounded-lg border bg-background p-1"
        aria-label="Catalog structure view"
      >
        {(["categories", "subcategories"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => setView(value)}
            className={cn(
              "cursor-pointer rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors",
              view === value
                ? "bg-secondary text-foreground"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {view === "categories" ? (
        <CategoriesTable
          accessToken={accessToken ?? ""}
          categories={categories}
          loading={loading}
          onChanged={handleChanged}
          onCreate={() => {
            setEditingCategory(null);
            setFormOpen(true);
          }}
          onEdit={(category) => {
            setEditingCategory(category);
            setFormOpen(true);
          }}
        />
      ) : (
        <SubcategoriesTable
          accessToken={accessToken ?? ""}
          categories={categories}
          subcategories={subcategories}
          loading={loading}
          onChanged={handleChanged}
          onCreate={() => {
            setEditingSubcategory(null);
            setSubcategoryFormOpen(true);
          }}
          onEdit={(subcategory) => {
            setEditingSubcategory(subcategory);
            setSubcategoryFormOpen(true);
          }}
        />
      )}

      {accessToken ? (
        <CategoryForm
          accessToken={accessToken}
          open={formOpen}
          category={editingCategory}
          onOpenChange={setFormOpen}
          onSaved={handleChanged}
        />
      ) : null}

      {accessToken ? (
        <SubcategoryForm
          accessToken={accessToken}
          categories={categories}
          open={subcategoryFormOpen}
          subcategory={editingSubcategory}
          onOpenChange={setSubcategoryFormOpen}
          onSaved={handleChanged}
        />
      ) : null}
    </div>
  );
}
