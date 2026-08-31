import {
  OrderTrackingApiError,
  refreshCustomerSession,
} from "@/features/order-tracking/lib/orderTrackingApi";
import type { CustomerSession } from "@/features/order-tracking/lib/types";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

let restorePromise: Promise<CustomerSession | null> | null = null;

export function restoreCustomerSession(): Promise<CustomerSession | null> {
  if (!restorePromise) {
    restorePromise = refreshCustomerSession()
      .then((session) => {
        useCustomerAuthStore.getState().setSession(session);
        return session;
      })
      .catch((error: unknown) => {
        useCustomerAuthStore.getState().clearSession();
        if (error instanceof OrderTrackingApiError && error.status === 401) {
          return null;
        }
        throw error;
      })
      .finally(() => {
        restorePromise = null;
      });
  }
  return restorePromise;
}
