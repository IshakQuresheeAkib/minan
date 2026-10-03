import type { SWRInfiniteKeyLoader } from "swr/infinite";

import {
  getCustomerOrders,
  OrderTrackingApiError,
} from "@/features/order-tracking/lib/orderTrackingApi";
import type { CustomerOrderHistoryPage } from "@/features/order-tracking/lib/types";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

export type CustomerOrderHistoryKey = readonly [
  "customer-orders",
  string,
  string | null,
];

export type CustomerOrderHistoryKeyLoader = SWRInfiniteKeyLoader<
  CustomerOrderHistoryPage,
  CustomerOrderHistoryKey | null
>;

export class CustomerOrderHistoryPageError extends Error {
  readonly cursor: string | null;
  readonly originalError: unknown;

  constructor(cursor: string | null, originalError: unknown) {
    super(
      originalError instanceof Error
        ? originalError.message
        : "The Order history request failed.",
    );
    this.name = "CustomerOrderHistoryPageError";
    this.cursor = cursor;
    this.originalError = originalError;
  }
}

export function createCustomerOrderHistoryKeyLoader(
  customerId: string | null,
): CustomerOrderHistoryKeyLoader {
  return (pageIndex, previousPage) => {
    if (!customerId) return null;
    if (pageIndex === 0) return ["customer-orders", customerId, null];

    const cursor = previousPage?.next_cursor;
    return cursor ? ["customer-orders", customerId, cursor] : null;
  };
}

export async function fetchCustomerOrderHistoryPage(
  [, customerId, cursor]: CustomerOrderHistoryKey,
): Promise<CustomerOrderHistoryPage> {
  const session = useCustomerAuthStore.getState().session;
  if (!session || session.customer.id !== customerId) {
    throw new Error("Customer session changed before the Order request started.");
  }

  const requestToken = session.accessToken;
  try {
    return await getCustomerOrders(requestToken, cursor ?? undefined);
  } catch (error) {
    const currentSession = useCustomerAuthStore.getState().session;
    if (
      error instanceof OrderTrackingApiError &&
      error.status === 401 &&
      currentSession?.customer.id === customerId &&
      currentSession.accessToken === requestToken
    ) {
      useCustomerAuthStore.getState().clearSession();
    }
    throw new CustomerOrderHistoryPageError(cursor, error);
  }
}

export function isCustomerOrderLoadMoreError(error: unknown): boolean {
  return error instanceof CustomerOrderHistoryPageError && error.cursor !== null;
}
