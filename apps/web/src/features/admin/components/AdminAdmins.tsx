"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchAdminUsers } from "@/features/admin/actions/admins.actions";
import { AdminForm } from "@/features/admin/components/AdminForm";
import { AdminsTable } from "@/features/admin/components/AdminsTable";
import type { AdminUser } from "@/features/admin/types";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

function getEmailFromAccessToken(accessToken: string | null): string | null {
  if (!accessToken) {
    return null;
  }

  try {
    const payload = accessToken.split(".")[1];
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(atob(payload)) as { email?: string };
    return typeof decoded.email === "string" ? decoded.email : null;
  } catch {
    return null;
  }
}

export function AdminAdmins() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const currentAdminEmail = useMemo(
    () => getEmailFromAccessToken(accessToken),
    [accessToken],
  );

  const reload = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const response = await fetchAdminUsers(accessToken);
    setAdmins(response.data);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;
    let cancelled = false;

    async function loadAdmins() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminUsers(token);
        if (!cancelled) {
          setAdmins(response.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Failed to load admins.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAdmins();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleChanged = useCallback(() => {
    void reload().catch((loadError: unknown) => {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load admins.",
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

      <AdminsTable
        accessToken={accessToken ?? ""}
        admins={admins}
        loading={loading}
        currentAdminEmail={currentAdminEmail}
        onChanged={handleChanged}
        onCreate={() => {
          setEditingAdmin(null);
          setFormOpen(true);
        }}
        onEdit={(admin) => {
          setEditingAdmin(admin);
          setFormOpen(true);
        }}
      />

      {accessToken ? (
        <AdminForm
          accessToken={accessToken}
          open={formOpen}
          admin={editingAdmin}
          onOpenChange={setFormOpen}
          onSaved={handleChanged}
        />
      ) : null}
    </>
  );
}
