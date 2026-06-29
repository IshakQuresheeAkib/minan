"use client";

import { toast } from "sonner";

import {
  deactivateAdminProduct,
  updateAdminProduct,
} from "@/features/admin/actions/products.actions";
import type { AdminProduct } from "@/features/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";

type ProductsTableProps = {
  accessToken: string;
  products: AdminProduct[];
  loading: boolean;
  onChanged: () => void;
  onCreate: () => void;
  onEdit: (product: AdminProduct) => void;
};

export function ProductsTable({
  accessToken,
  products,
  loading,
  onChanged,
  onCreate,
  onEdit,
}: ProductsTableProps) {
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
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product catalog including inactive items.
          </p>
        </div>
        <Button type="button" onClick={onCreate}>
          Add product
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products found.</p>
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
                  <TableCell className="font-medium">{product.name}</TableCell>
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
                      variant="outline"
                      onClick={() => onEdit(product)}
                    >
                      Edit
                    </Button>
                    {product.is_active ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
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
    </div>
  );
}
