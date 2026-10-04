"use client";

import useSWR from "swr";

import { checkoutConfigSchema } from "@/features/checkout/schemas/checkout-config.schema";
import { apiRequest } from "@/lib/api/client";

export function useCheckoutConfig() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    "checkout-config",
    async () => {
      const response = await apiRequest<{ data: unknown }>("/api/checkout/config");
      return checkoutConfigSchema.parse(response.data);
    },
    { dedupingInterval: 60_000, shouldRetryOnError: false },
  );
  return {
    config: data ?? null,
    configLoading: isLoading,
    configValidating: isValidating,
    configError: error,
    retryConfig: () => { void mutate().catch(() => undefined); },
  };
}
