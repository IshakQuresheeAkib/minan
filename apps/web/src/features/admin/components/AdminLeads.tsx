"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchAdminLeads } from "@/features/admin/actions/leads.actions";
import { LeadDetailDialog } from "@/features/admin/components/LeadDetailDialog";
import { LeadsTable } from "@/features/admin/components/LeadsTable";
import type { AdminLead } from "@/features/admin/types";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

export function AdminLeads() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const response = await fetchAdminLeads(accessToken);
    setLeads(response.data);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;
    let cancelled = false;

    async function loadLeads() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminLeads(token);
        if (!cancelled) {
          setLeads(response.data);
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

    void loadLeads();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleSaved = useCallback(() => {
    void reload().catch((loadError: unknown) => {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load leads.",
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

      <LeadsTable
        leads={leads}
        loading={loading}
        onView={(lead) => {
          setSelectedLead(lead);
          setDialogOpen(true);
        }}
      />

      {accessToken ? (
        <LeadDetailDialog
          accessToken={accessToken}
          lead={selectedLead}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSaved={handleSaved}
        />
      ) : null}
    </>
  );
}
