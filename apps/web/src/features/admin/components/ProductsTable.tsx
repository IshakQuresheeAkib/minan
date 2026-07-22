"use client";

import { useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import {
  deactivateAdminProduct,
  deleteAdminProduct,
  updateAdminProduct,
} from "@/features/admin/actions/products.actions";
import { TablePagination } from "@/features/admin/components/TablePagination";
import type {
  AdminCategory,
  AdminProduct,
  AdminSubcategory,
} from "@/features/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductPrice } from "@/features/products/components/ProductPrice";
import { ApiError } from "@/lib/api/client";

type ProductStatusFilter = "all" | "active" | "inactive";

type ProductFilterDraft = {
  search: string;
  categoryId: string;
  status: ProductStatusFilter;
};

type ProductsTableProps = {
  accessToken: string;
  products: AdminProduct[];
  categories: AdminCategory[];
  subcategories: AdminSubcategory[];
  loading: boolean;
  categoriesLoading: boolean;
  categoriesError: string | null;
  filterDraft: ProductFilterDraft;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onFilterDraftChange: (draft: ProductFilterDraft) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onChanged: () => void;
  onCreate: () => void;
  onEdit: (product: AdminProduct) => void;
};

const CATEGORY_ALL_VALUE = "__all_categories__";

function getStatusFilter(value: string): ProductStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

export function ProductsTable({
  accessToken,
  products,
  categories,
  subcategories,
  loading,
  categoriesLoading,
  categoriesError,
  filterDraft,
  page,
  totalPages,
  total,
  limit,
  onFilterDraftChange,
  onApplyFilters,
  onClearFilters,
  onPageChange,
  onChanged,
  onCreate,
  onEdit,
}: ProductsTableProps) {
  const [productToDelete, setProductToDelete] =
    useState<AdminProduct | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleting = deletingProductId !== null;
  const categoryIdsWithSubcategories = new Set(
    subcategories
      .filter((subcategory) => subcategory.is_active)
      .map((subcategory) => subcategory.category_id),
  );
  const selectedCategoryMissing =
    filterDraft.categoryId !== "" &&
    filterDraft.categoryId !== CATEGORY_ALL_VALUE &&
    !categories.some((category) => category._id === filterDraft.categoryId);

  async function handleDeactivate(product: AdminProduct) {
    try {
      await deactivateAdminProduct(accessToken, product._id);
      toast.success("Product deactivated");
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to deactivate product",
      );
    }
  }

  async function handleReactivate(product: AdminProduct) {
    try {
      await updateAdminProduct(accessToken, product._id, { is_active: true });
      toast.success("Product reactivated");
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to reactivate product",
      );
    }
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    if (!open && !deleting) {
      setProductToDelete(null);
      setDeleteError(null);
    }
  }

  async function handleDelete() {
    if (!productToDelete || deleting) {
      return;
    }

    setDeletingProductId(productToDelete._id);
    setDeleteError(null);

    try {
      const response = await deleteAdminProduct(
        accessToken,
        productToDelete._id,
      );
      const failedImageCount = response.data.mediaCleanup.failed;

      setProductToDelete(null);

      if (failedImageCount > 0) {
        toast.warning(
          `Product deleted, but ${failedImageCount} image${failedImageCount === 1 ? "" : "s"} could not be removed from Cloudinary.`,
        );
      } else {
        toast.success("Product permanently deleted");
      }

      if (products.length === 1 && page > 1) {
        onPageChange(page - 1);
      } else {
        onChanged();
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to permanently delete product";
      setDeleteError(`${message}. Please try again.`);
    } finally {
      setDeletingProductId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Products</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Manage product catalog including inactive items.
          </p>
        </div>
        <Button type="button" onClick={onCreate}>
          Add product
        </Button>
      </div>

      <form
        className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          onApplyFilters();
        }}
      >
        <label className="grid gap-1 text-sm font-medium">
          Search
          <Input
            value={filterDraft.search}
            placeholder="Name, slug, description"
            onChange={(event) =>
              onFilterDraftChange({
                ...filterDraft,
                search: event.target.value,
              })
            }
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Category
          <Select
            value={filterDraft.categoryId || CATEGORY_ALL_VALUE}
            onValueChange={(value) =>
              onFilterDraftChange({
                ...filterDraft,
                categoryId: value === CATEGORY_ALL_VALUE ? "" : value,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CATEGORY_ALL_VALUE}>All categories</SelectItem>
              {selectedCategoryMissing ? (
                <SelectItem value={filterDraft.categoryId}>
                  Selected category
                </SelectItem>
              ) : null}
              {categories.map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Status
          <Select
            value={filterDraft.status}
            onValueChange={(value) =>
              onFilterDraftChange({
                ...filterDraft,
                status: getStatusFilter(value),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <Button disabled={loading} type="submit">
            Apply
          </Button>
          <Button
            disabled={loading}
            type="button"
            variant="secondary"
            onClick={onClearFilters}
          >
            Clear
          </Button>
        </div>
      </form>

      {categoriesLoading ? (
        <p className="text-xs text-foreground/70">Loading categories...</p>
      ) : categoriesError ? (
        <p className="text-xs text-destructive" role="alert">
          {categoriesError}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-foreground/70">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-foreground/70">No products found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    <div className="mt-1 text-xs text-foreground/65">
                      {product.category?.name ?? "Unknown category"}
                      {product.subcategory
                        ? ` / ${product.subcategory.name}`
                        : ""}
                    </div>
                    {!product.subcategory &&
                    categoryIdsWithSubcategories.has(product.category_id) ? (
                      <Badge className="mt-2" variant="destructive">
                        Needs subcategory
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <ProductPrice
                      className="max-w-44"
                      price={product.discounted_price}
                      originalPrice={product.price}
                      discount={product.discount}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit(product)}
                      >
                        Edit
                      </Button>
                      {product.is_active ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="border-destructive text-destructive shadow-destructive/20 hover:bg-destructive hover:text-background hover:shadow-destructive/40"
                          onClick={() => {
                            void handleDeactivate(product);
                          }}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            void handleReactivate(product);
                          }}
                        >
                          Reactivate
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="border-destructive text-destructive shadow-none hover:bg-destructive hover:text-background hover:shadow-none"
                        aria-label={`Permanently delete ${product.name}`}
                        onClick={() => {
                          setDeleteError(null);
                          setProductToDelete(product);
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        disabled={loading}
        onPageChange={onPageChange}
      />

      <Dialog
        open={productToDelete !== null}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          onEscapeKeyDown={(event) => {
            if (deleting) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (deleting) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader className="text-left">
            <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Permanently delete product?</DialogTitle>
            <DialogDescription className="leading-6">
              <span className="font-semibold text-foreground">
                {productToDelete?.name}
              </span>{" "}
              will be completely removed from the catalog and cannot be
              recovered. Its unshared MINAN Cloudinary images will also be
              deleted.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {deleteError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              autoFocus
              disabled={deleting}
              onClick={() => handleDeleteDialogOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="border-destructive bg-destructive text-background shadow-destructive/20 hover:bg-destructive/90 hover:text-background hover:shadow-destructive/30"
              loading={deleting}
              loadingText="Deleting..."
              onClick={() => {
                void handleDelete();
              }}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
