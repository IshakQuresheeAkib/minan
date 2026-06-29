import { apiRequest } from "@/lib/api/client";
import type { AuthSessionResponse } from "@/features/admin/types";

let refreshPromise: Promise<AuthSessionResponse> | null = null;

export async function loginAdmin(input: {
  email: string;
  password: string;
}): Promise<AuthSessionResponse> {
  return apiRequest<AuthSessionResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
}

export function refreshSession(): Promise<AuthSessionResponse> {
  if (!refreshPromise) {
    refreshPromise = apiRequest<AuthSessionResponse>("/api/auth/refresh", {
      method: "POST",
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function logoutAdmin(): Promise<void> {
  await apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}
