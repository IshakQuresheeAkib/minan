"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchAdminLead,
  fetchAdminLeads,
} from "@/features/admin/actions/leads.actions";
import { LeadDetailDialog } from "@/features/admin/components/LeadDetailDialog";
import { LeadsTable } from "@/features/admin/components/LeadsTable";
import type { AdminLead } from "@/features/admin/types";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

const PAGE_LIMIT = 20;

export function AdminLeads() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const activeLeadRequestId = useRef<string | null>(null);

  const loadLeads = useCallback(
    async (pageNum: number) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAdminLeads(accessToken, pageNum);
        setLeads(response.data);
        setTotal(response.total);
        setTotalPages(Math.max(1, Math.ceil(response.total / response.limit)));
      } catch (loadError) {
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Failed to load leads.",
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
        const response = await fetchAdminLeads(accessToken!, page);
        if (!cancelled) {
          setLeads(response.data);
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
              : "Failed to load leads.",
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

  const handleSaved = useCallback(() => {
    void loadLeads(page).catch((loadError: unknown) => {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load leads.",
      );
    });
  }, [loadLeads, page]);

  return (
    <>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <LeadsTable
        leads={leads}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={PAGE_LIMIT}
        onPageChange={setPage}
        onView={(lead) => {
          const requestedLeadId = lead._id;
          activeLeadRequestId.current = requestedLeadId;
          setSelectedLead(lead);
          setDialogOpen(true);
          if (accessToken) {
            void fetchAdminLead(accessToken, requestedLeadId)
              .then((response) => {
                if (activeLeadRequestId.current === requestedLeadId) {
                  setSelectedLead(response.data);
                }
              })
              .catch((loadError: unknown) => {
                if (activeLeadRequestId.current === requestedLeadId) {
                  setError(
                    loadError instanceof ApiError
                      ? loadError.message
                      : "Failed to load payment history.",
                  );
                }
              });
          }
        }}
      />

      {accessToken ? (
        <LeadDetailDialog
          accessToken={accessToken}
          lead={selectedLead}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) activeLeadRequestId.current = null;
          }}
          onSaved={handleSaved}
        />
      ) : null}
    </>
  );
}
