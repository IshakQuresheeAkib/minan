"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchAdminProducts } from "@/features/admin/actions/products.actions";
import { ProductForm } from "@/features/admin/components/ProductForm";
import { ProductsTable } from "@/features/admin/components/ProductsTable";
import type { AdminProduct } from "@/features/admin/types";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

const PAGE_LIMIT = 20;

export function AdminProducts() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadProducts = useCallback(
    async (pageNum: number) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAdminProducts(accessToken, pageNum);
        setProducts(response.data);
        setTotal(response.total);
        setTotalPages(Math.max(1, Math.ceil(response.total / response.limit)));
      } catch (loadError) {
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Failed to load products.",
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAdminProducts(accessToken!, page);
        if (!cancelled) {
          setProducts(response.data);
          setTotal(response.total);
          setTotalPages(
            Math.max(1, Math.ceil(response.total / response.limit)),
          );
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

    void run();

    return () => {
      cancelled = true;
    };
  }, [accessToken, page]);

  const handleChanged = useCallback(() => {
    void loadProducts(page).catch((loadError: unknown) => {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load products.",
      );
    });
  }, [loadProducts, page]);

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
        page={page}
        totalPages={totalPages}
        total={total}
        limit={PAGE_LIMIT}
        onPageChange={setPage}
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
