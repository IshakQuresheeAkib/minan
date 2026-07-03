"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { refreshSession } from "@/features/admin/actions/auth.actions";
import type { AuthSessionResponse } from "@/features/admin/types";
import { adminRoutes, publicRoutes } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

type AdminSessionProviderProps = {
  children: ReactNode;
};

const premiumOnlyPaths = [
  adminRoutes.products,
  adminRoutes.categories,
  adminRoutes.leads,
  adminRoutes.admins,
] as const;

function isPremiumOnlyPath(pathname: string): boolean {
  return premiumOnlyPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function getLoginRedirectUrl(): string {
  const nextPath = `${window.location.pathname}${window.location.search}`;

  if (nextPath.startsWith("/admin") && nextPath !== publicRoutes.adminLogin) {
    return `${publicRoutes.adminLogin}?next=${encodeURIComponent(nextPath)}`;
  }

  return publicRoutes.adminLogin;
}

export function AdminSessionProvider({ children }: AdminSessionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      function applySession(session: AuthSessionResponse) {
        setSession({
          accessToken: session.accessToken,
          role: session.role,
        });

        if (session.role !== "premium" && isPremiumOnlyPath(pathname)) {
          router.replace(adminRoutes.dashboard);
        }
      }

      try {
        const session = await refreshSession();
        if (cancelled) {
          return;
        }

        applySession(session);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 409) {
          try {
            const session = await refreshSession();
            if (cancelled) {
              return;
            }

            applySession(session);
            setReady(true);
          } catch {
            if (!cancelled) {
              clearSession();
              router.replace(getLoginRedirectUrl());
            }
          }
          return;
        }

        clearSession();
        router.replace(getLoginRedirectUrl());
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
  }, [clearSession, pathname, router, setSession]);

  useEffect(() => {
    if (ready && accessToken === null) {
      router.replace(getLoginRedirectUrl());
    }
  }, [accessToken, ready, router]);

  useEffect(() => {
    if (ready && role !== "premium" && isPremiumOnlyPath(pathname)) {
      router.replace(adminRoutes.dashboard);
    }
  }, [pathname, ready, role, router]);

  const isRedirectingUnauthorizedRoute =
    ready && role !== "premium" && isPremiumOnlyPath(pathname);

  if (!ready || isRedirectingUnauthorizedRoute) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <p className="text-sm text-foreground/70">Loading admin session...</p>
      </div>
    );
  }

  return children;
}
