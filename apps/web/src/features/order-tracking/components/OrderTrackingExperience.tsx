"use client";

import { PublicOrderLookup } from "@/features/order-tracking/components/PublicOrderLookup";
import { normalizePublicOrderNumber } from "@/features/order-tracking/lib/trackingPresentation";

export function OrderTrackingExperience({
  orderNumber,
  hasOrderQuery,
}: {
  orderNumber: string;
  hasOrderQuery: boolean;
}) {
  const initialOrderNumber = normalizePublicOrderNumber(orderNumber);

  return (
    <PublicOrderLookup
      initialOrderNumber={initialOrderNumber}
      clearInvalidOrderQuery={hasOrderQuery && !initialOrderNumber}
    />
  );
}
