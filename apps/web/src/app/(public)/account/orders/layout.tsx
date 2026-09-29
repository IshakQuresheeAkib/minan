import type { ReactNode } from "react";

import { CustomerOrderSessionBoundary } from "@/features/order-tracking/components/CustomerOrderSessionBoundary";

export default function CustomerOrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <CustomerOrderSessionBoundary>{children}</CustomerOrderSessionBoundary>;
}
