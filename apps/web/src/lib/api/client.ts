import { useAuthStore } from "@/store/auth.store";

const BASE_URL = process.env.API_PROXY_TARGET?.trim() || "";

type JsonBody = Record<string, unknown> | readonly unknown[];

type AuthSessionResponse = {
  accessToken: string;
};

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  accessToken?: string | null;
  body?: BodyInit | JsonBody | null;
  _retrying?: boolean;
};

let refreshPromise: Promise<AuthSessionResponse> | null = null;

async function parseErrorMessage(response: Response): Promise<string> {
  let message = response.statusText || "API request failed";

  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      message = payload.error;
    }
  } catch {
    // Keep default message when body is not JSON.
  }

  return message;
}

async function refreshAccessToken(): Promise<AuthSessionResponse> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        const message = await parseErrorMessage(response);
        throw new ApiError(message, response.status);
      }

      const session = (await response.json()) as {
        accessToken?: unknown;
      };

      if (typeof session.accessToken !== "string") {
        throw new ApiError("Invalid refresh response", 500);
      }

      const nextSession: AuthSessionResponse = {
        accessToken: session.accessToken,
      };

      useAuthStore.getState().setSession(nextSession);
      return nextSession;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const {
    accessToken,
    _retrying,
    body: requestBody,
    ...fetchOptions
  } = options;
  const headers = new Headers(fetchOptions.headers);
  const method = fetchOptions.method ?? "GET";
  let body = requestBody;

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (method !== "GET") {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob)
  ) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    method,
    headers,
    body,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401 && accessToken && !_retrying) {
      try {
        const session = await refreshAccessToken();
        return apiRequest<TResponse>(path, {
          ...options,
          accessToken: session.accessToken,
          _retrying: true,
        });
      } catch (refreshError) {
        useAuthStore.getState().clearSession();
        if (refreshError instanceof ApiError) {
          throw refreshError;
        }
        throw new ApiError("Session expired", 401);
      }
    }

    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
