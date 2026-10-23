"use client";

import { useEffect } from "react";
import useSWR from "swr";

import { checkoutConfigSchema } from "@/features/checkout/schemas/checkout-config.schema";
import { restoreCustomerSession } from "@/features/order-tracking/lib/customerSession";
import { apiRequest } from "@/lib/api/client";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

export function useCheckoutConfig() {
  const { session, status } = useCustomerAuthStore();

  useEffect(() => {
    if (status === "unknown") {
      void restoreCustomerSession().catch(() => undefined);
    }
  }, [status]);

  const uat = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("uat") : null;
  const query = uat ? `?uat=${encodeURIComponent(uat)}` : "";
  const customerKey = status === "unknown" ? null : (session?.customer?.id ?? "anonymous");
  const swrKey = customerKey ? `checkout-config:${customerKey}${query}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKey,
    async () => {
      const response = await apiRequest<{ data: unknown }>(
        `/api/checkout/config${query}`,
        session?.accessToken ? { accessToken: session.accessToken, _retrying: true } : {},
      );
      return checkoutConfigSchema.parse(response.data);
    },
    { dedupingInterval: 60_000, shouldRetryOnError: false },
  );

  return {
    config: data ?? null,
    configLoading: status === "unknown" || (swrKey !== null && isLoading),
    configValidating: isValidating,
    configError: error,
    retryConfig: async () => {
      if (status === "unknown") {
        await restoreCustomerSession().catch(() => undefined);
      }
      await mutate().catch(() => undefined);
    },
  };
}
