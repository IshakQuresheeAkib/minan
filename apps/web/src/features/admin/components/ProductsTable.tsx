"use client";

import { toast } from "sonner";

import {
  deactivateAdminProduct,
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
                <TableHead>Slug</TableHead>
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
                  <TableCell>{product.slug}</TableCell>
                  <TableCell>৳{product.price}</TableCell>
                  <TableCell>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
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
    </div>
  );
}
