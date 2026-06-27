import { apiRequest } from "@/lib/api/client";
import type { AuthSessionResponse } from "@/features/admin/types";

export async function loginAdmin(input: {
  email: string;
  password: string;
}): Promise<AuthSessionResponse> {
  return apiRequest<AuthSessionResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function refreshSession(): Promise<AuthSessionResponse> {
  return apiRequest<AuthSessionResponse>("/api/auth/refresh", {
    method: "POST",
  });
}

export async function logoutAdmin(): Promise<void> {
  await apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}
