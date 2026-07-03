"use client";

import type { AdminLead } from "@/features/admin/types";
import { TablePagination } from "@/features/admin/components/TablePagination";
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

type LeadsTableProps = {
  leads: AdminLead[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onView: (lead: AdminLead) => void;
};

const statusVariant: Record<
  AdminLead["status"],
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
};

export function LeadsTable({
  leads,
  loading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onView,
}: LeadsTableProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Leads</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Leads appear here once checkout submissions exist or data is seeded.
          An empty table is expected until then.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-foreground/70">Loading leads...</p>
      ) : leads.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-foreground/70">
          No leads yet. Leads will show up after checkout submissions or manual
          seeding.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead._id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.phone_number}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[lead.status]}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(lead.createdAt).toLocaleDateString("en-BD")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onView(lead)}
                    >
                      View
                    </Button>
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
