"use client";

import { toast } from "sonner";

import {
  deactivateAdminCategory,
  updateAdminCategory,
} from "@/features/admin/actions/categories.actions";
import type { AdminCategory } from "@/features/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";

type CategoriesTableProps = {
  accessToken: string;
  categories: AdminCategory[];
  loading: boolean;
  onChanged: () => void;
  onCreate: () => void;
  onEdit: (category: AdminCategory) => void;
};

export function CategoriesTable({
  accessToken,
  categories,
  loading,
  onChanged,
  onCreate,
  onEdit,
}: CategoriesTableProps) {
  async function handleDeactivate(category: AdminCategory) {
    try {
      await deactivateAdminCategory(accessToken, category._id);
      toast.success("Category deactivated");
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to deactivate category",
      );
    }
  }

  async function handleReactivate(category: AdminCategory) {
    try {
      await updateAdminCategory(accessToken, category._id, { is_active: true });
      toast.success("Category reactivated");
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to reactivate category",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin-managed categories. Public homepage chips remain static for
            now.
          </p>
        </div>
        <Button type="button" onClick={onCreate}>
          Add category
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>
                    <Badge
                      variant={category.is_active ? "default" : "secondary"}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(category)}
                    >
                      Edit
                    </Button>
                    {category.is_active ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="border-destructive text-destructive shadow-destructive/20 hover:bg-destructive hover:text-white hover:shadow-destructive/40"
                        onClick={() => {
                          void handleDeactivate(category);
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
                          void handleReactivate(category);
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
    </div>
  );
}
