"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

import { useCustomerAuthStore } from "@/store/customer-auth.store";

export function CustomerOrderSessionBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const customerId = useCustomerAuthStore(
    (state) => state.session?.customer.id ?? null,
  );

  return (
    <SWRConfig
      key={customerId ?? "anonymous"}
      value={{ provider: () => new Map() }}
    >
      {children}
    </SWRConfig>
  );
}
