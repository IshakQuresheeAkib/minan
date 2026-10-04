import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteDataSkeleton } from "@/components/shared/RouteDataSkeleton";

import { OrderTrackingExperience } from "@/features/order-tracking/components/OrderTrackingExperience";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Order tracking",
  robots: privatePageRobots,
};

type OrderTrackingPageProps = {
  searchParams: Promise<{
    order?: string | string[];
  }>;
};

export default function OrderTrackingPage(props: OrderTrackingPageProps) {
  return <Suspense fallback={<RouteDataSkeleton title="Order tracking" />}><RequestedOrderTracking {...props} /></Suspense>;
}

async function RequestedOrderTracking({
  searchParams,
}: OrderTrackingPageProps) {
  const params = await searchParams;
  const orderNumber = typeof params.order === "string"
    ? params.order.trim()
    : "";

  return (
    <OrderTrackingExperience
      orderNumber={orderNumber}
      hasOrderQuery={params.order !== undefined}
    />
  );
}
