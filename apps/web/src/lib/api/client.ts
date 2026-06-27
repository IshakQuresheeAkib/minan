import { env } from "@/config/env";

type JsonBody = Record<string, unknown> | readonly unknown[];

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  accessToken?: string | null;
  body?: BodyInit | JsonBody | null;
};

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
  const headers = new Headers(options.headers);
  const method = options.method ?? "GET";
  let body = options.body;

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
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

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    method,
    headers,
    body,
    credentials: "include",
  });

  if (!response.ok) {
    let message = response.statusText || "API request failed";

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Keep default message when body is not JSON.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
