"use client";

import { toast } from "sonner";

import {
  deactivateAdminUser,
  updateAdminUser,
} from "@/features/admin/actions/admins.actions";
import type { AdminUser } from "@/features/admin/types";
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

type AdminsTableProps = {
  accessToken: string;
  admins: AdminUser[];
  loading: boolean;
  currentAdminEmail: string | null;
  onChanged: () => void;
  onCreate: () => void;
  onEdit: (admin: AdminUser) => void;
};

export function AdminsTable({
  accessToken,
  admins,
  loading,
  currentAdminEmail,
  onChanged,
  onCreate,
  onEdit,
}: AdminsTableProps) {
  async function handleDeactivate(admin: AdminUser) {
    try {
      await deactivateAdminUser(accessToken, admin._id);
      toast.success("Admin deactivated");
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to deactivate admin",
      );
    }
  }

  async function handleReactivate(admin: AdminUser) {
    try {
      await updateAdminUser(accessToken, admin._id, { is_active: true });
      toast.success("Admin reactivated");
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to reactivate admin",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Admins</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Create admin accounts and manage active access.
          </p>
        </div>
        <Button type="button" onClick={onCreate}>
          Add admin
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-foreground/70">Loading admins...</p>
      ) : admins.length === 0 ? (
        <p className="text-sm text-foreground/70">No admins found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const isSelf = currentAdminEmail === admin.email;

                return (
                  <TableRow key={admin._id}>
                    <TableCell className="font-medium">
                      {admin.email}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-foreground/70">
                          (you)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={admin.is_active ? "default" : "secondary"}
                      >
                        {admin.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit(admin)}
                      >
                        Edit
                      </Button>
                      {admin.is_active ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="border-destructive text-destructive shadow-destructive/20 hover:bg-destructive hover:text-background hover:shadow-destructive/40"
                          disabled={isSelf}
                          onClick={() => {
                            void handleDeactivate(admin);
                          }}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isSelf}
                          onClick={() => {
                            void handleReactivate(admin);
                          }}
                        >
                          Reactivate
                        </Button>
                      )}
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
