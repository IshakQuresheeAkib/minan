import type {
  CustomerOrderTracking,
  CustomerSession,
} from "@/features/order-tracking/lib/types";

const BASE_URL = process.env.API_PROXY_TARGET?.trim() || "";

type JsonBody = Record<string, unknown>;

type RequestOptions = Omit<RequestInit, "body"> & {
  accessToken?: string;
  body?: JsonBody;
};

export class OrderTrackingApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OrderTrackingApiError";
    this.status = status;
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string" && payload.error) {
      return payload.error;
    }
  } catch {
    // Use the generic message below when the response is not JSON.
  }

  return response.statusText || "Unable to complete this request";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, body, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  const method = fetchOptions.method ?? "GET";

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (method !== "GET") {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }
  if (body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    headers,
    method,
  });

  if (!response.ok) {
    throw new OrderTrackingApiError(await readError(response), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

type GuestOrderCredentials = {
  orderNumber: string;
  email: string;
};

export async function requestGuestOrderOtp(input: GuestOrderCredentials): Promise<void> {
  await request<{ accepted: true }>("/api/guest-order-access/otp/request", {
    body: {
      email: input.email,
      order_number: input.orderNumber,
    },
    method: "POST",
  });
}

export async function verifyGuestOrderOtp(
  input: GuestOrderCredentials & { otp: string },
): Promise<void> {
  await request<{ verified: true }>("/api/guest-order-access/otp/verify", {
    body: {
      email: input.email,
      order_number: input.orderNumber,
      otp: input.otp,
    },
    method: "POST",
  });
}

export async function getGuestOrder(orderNumber: string): Promise<CustomerOrderTracking> {
  const result = await request<{ order: CustomerOrderTracking }>(
    `/api/guest-order-access/orders/${encodeURIComponent(orderNumber)}`,
  );
  return result.order;
}

export async function getCustomerOrder(
  orderNumber: string,
  accessToken: string,
): Promise<CustomerOrderTracking> {
  const result = await request<{ order: CustomerOrderTracking }>(
    `/api/customer-orders/${encodeURIComponent(orderNumber)}`,
    { accessToken },
  );
  return result.order;
}

export async function claimGuestOrder(
  orderNumber: string,
  accessToken: string,
): Promise<CustomerOrderTracking> {
  const result = await request<{ order: CustomerOrderTracking }>(
    `/api/guest-order-access/orders/${encodeURIComponent(orderNumber)}/claim`,
    { accessToken, body: {}, method: "POST" },
  );
  return result.order;
}

export async function loginCustomer(input: {
  email: string;
  password: string;
}): Promise<CustomerSession> {
  return request<CustomerSession>("/api/customer-auth/login", {
    body: input,
    method: "POST",
  });
}

export async function refreshCustomerSession(): Promise<CustomerSession> {
  return request<CustomerSession>("/api/customer-auth/refresh", { method: "POST" });
}

export async function logoutCustomer(): Promise<void> {
  await request<void>("/api/customer-auth/logout", { method: "POST" });
}
