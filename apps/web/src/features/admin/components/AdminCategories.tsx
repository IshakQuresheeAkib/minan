"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchAdminCategories } from "@/features/admin/actions/categories.actions";
import { CategoryForm } from "@/features/admin/components/CategoryForm";
import { CategoriesTable } from "@/features/admin/components/CategoriesTable";
import type { AdminCategory } from "@/features/admin/types";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

export function AdminCategories() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null,
  );

  const reload = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const response = await fetchAdminCategories(accessToken);
    setCategories(response.data);
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
        const response = await fetchAdminCategories(token);
        if (!cancelled) {
          setCategories(response.data);
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
    <>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

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

      {accessToken ? (
        <CategoryForm
          accessToken={accessToken}
          open={formOpen}
          category={editingCategory}
          onOpenChange={setFormOpen}
          onSaved={handleChanged}
        />
      ) : null}
    </>
  );
}
