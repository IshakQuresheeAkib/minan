"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchAdminProducts } from "@/features/admin/actions/products.actions";
import { ProductForm } from "@/features/admin/components/ProductForm";
import { ProductsTable } from "@/features/admin/components/ProductsTable";
import type { AdminProduct } from "@/features/admin/types";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

export function AdminProducts() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );

  const reload = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const response = await fetchAdminProducts(accessToken);
    setProducts(response.data);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminProducts(token);
        if (!cancelled) {
          setProducts(response.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Failed to load products.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleChanged = useCallback(() => {
    void reload().catch((loadError: unknown) => {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load products.",
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

      <ProductsTable
        accessToken={accessToken ?? ""}
        products={products}
        loading={loading}
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
