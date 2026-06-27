"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { refreshSession } from "@/features/admin/actions/auth.actions";
import { publicRoutes } from "@/constants/routes";
import { useAuthStore } from "@/store/auth.store";

type AdminSessionProviderProps = {
  children: ReactNode;
};

export function AdminSessionProvider({ children }: AdminSessionProviderProps) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      try {
        const session = await refreshSession();
        if (cancelled) {
          return;
        }

        setSession({
          accessToken: session.accessToken,
          role: session.role,
        });
      } catch {
        if (cancelled) {
          return;
        }

        clearSession();
        router.replace(publicRoutes.adminLogin);
        return;
      }

      if (!cancelled) {
        setReady(true);
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession, router, setSession]);

  if (!ready) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading admin session...
        </p>
      </div>
    );
  }

  return children;
}
