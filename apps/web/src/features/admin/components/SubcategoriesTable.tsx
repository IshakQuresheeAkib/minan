"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  deactivateAdminSubcategory,
  reactivateAdminSubcategory,
  reorderAdminSubcategories,
} from "@/features/admin/actions/subcategories.actions";
import type {
  AdminCategory,
  AdminSubcategory,
} from "@/features/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
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

const ALL_CATEGORIES = "__all_categories__";

type SubcategoriesTableProps = {
  accessToken: string;
  categories: AdminCategory[];
  subcategories: AdminSubcategory[];
  loading: boolean;
  onChanged: () => void;
  onCreate: () => void;
  onEdit: (subcategory: AdminSubcategory) => void;
};

function sortSubcategories(
  subcategories: AdminSubcategory[],
  categoryNameById: Map<string, string>,
) {
  return [...subcategories].sort((first, second) => {
    const categoryOrder = (
      categoryNameById.get(first.category_id) ?? ""
    ).localeCompare(categoryNameById.get(second.category_id) ?? "");
    return (
      categoryOrder ||
      first.display_order - second.display_order ||
      first.name.localeCompare(second.name)
    );
  });
}

export function SubcategoriesTable({
  accessToken,
  categories,
  subcategories,
  loading,
  onChanged,
  onCreate,
  onEdit,
}: SubcategoriesTableProps) {
  const [categoryId, setCategoryId] = useState(ALL_CATEGORIES);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category._id, category.name])),
    [categories],
  );
  const visibleSubcategories = useMemo(() => {
    const filtered =
      categoryId === ALL_CATEGORIES
        ? subcategories
        : subcategories.filter(
            (subcategory) => subcategory.category_id === categoryId,
          );
    return sortSubcategories(filtered, categoryNameById);
  }, [categoryId, categoryNameById, subcategories]);

  async function handleStatusChange(
    subcategory: AdminSubcategory,
    activate: boolean,
  ) {
    try {
      if (activate) {
        await reactivateAdminSubcategory(accessToken, subcategory._id);
        toast.success("Subcategory reactivated");
      } else {
        await deactivateAdminSubcategory(accessToken, subcategory._id);
        toast.success("Subcategory deactivated");
      }
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : `Failed to ${activate ? "reactivate" : "deactivate"} subcategory`,
      );
    }
  }

  async function moveSubcategory(
    subcategory: AdminSubcategory,
    direction: -1 | 1,
  ) {
    const siblings = subcategories
      .filter((item) => item.category_id === subcategory.category_id)
      .sort(
        (first, second) =>
          first.display_order - second.display_order ||
          first.name.localeCompare(second.name),
      );
    const currentIndex = siblings.findIndex(
      (item) => item._id === subcategory._id,
    );
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
      return;
    }

    const reordered = [...siblings];
    const current = reordered[currentIndex];
    const target = reordered[targetIndex];
    if (!current || !target) {
      return;
    }
    reordered[currentIndex] = target;
    reordered[targetIndex] = current;
    setReorderingId(subcategory._id);

    try {
      await reorderAdminSubcategories(
        accessToken,
        subcategory.category_id,
        reordered.map((item) => item._id),
      );
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to reorder subcategories",
      );
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Subcategories
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Organize product types within each category.
          </p>
        </div>
        <Button
          type="button"
          disabled={categories.length === 0}
          onClick={onCreate}
        >
          Add subcategory
        </Button>
      </div>

      <label className="grid max-w-sm gap-1 text-sm font-medium">
        Parent category
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {loading ? (
        <p className="text-sm text-foreground/70">Loading subcategories...</p>
      ) : visibleSubcategories.length === 0 ? (
        <p className="text-sm text-foreground/70">No subcategories found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSubcategories.map((subcategory) => {
                const siblings = subcategories
                  .filter(
                    (item) => item.category_id === subcategory.category_id,
                  )
                  .sort(
                    (first, second) =>
                      first.display_order - second.display_order ||
                      first.name.localeCompare(second.name),
                  );
                const siblingIndex = siblings.findIndex(
                  (item) => item._id === subcategory._id,
                );

                return (
                  <TableRow key={subcategory._id}>
                    <TableCell>
                      {categoryNameById.get(subcategory.category_id) ??
                        subcategory.category?.name ??
                        "Unknown"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {subcategory.name}
                    </TableCell>
                    <TableCell>{subcategory.slug}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          subcategory.is_active ? "default" : "secondary"
                        }
                      >
                        {subcategory.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{subcategory.display_order + 1}</TableCell>
                    <TableCell>
                      <div className="flex min-w-max justify-end gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="size-9"
                          disabled={
                            reorderingId !== null || siblingIndex <= 0
                          }
                          aria-label={`Move ${subcategory.name} up`}
                          title="Move up"
                          onClick={() => {
                            void moveSubcategory(subcategory, -1);
                          }}
                        >
                          <ChevronUp className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="size-9"
                          disabled={
                            reorderingId !== null ||
                            siblingIndex === siblings.length - 1
                          }
                          aria-label={`Move ${subcategory.name} down`}
                          title="Move down"
                          onClick={() => {
                            void moveSubcategory(subcategory, 1);
                          }}
                        >
                          <ChevronDown className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => onEdit(subcategory)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className={
                            subcategory.is_active
                              ? "border-destructive text-destructive shadow-destructive/20 hover:bg-destructive hover:text-background hover:shadow-destructive/40"
                              : undefined
                          }
                          onClick={() => {
                            void handleStatusChange(
                              subcategory,
                              !subcategory.is_active,
                            );
                          }}
                        >
                          {subcategory.is_active ? "Deactivate" : "Reactivate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
