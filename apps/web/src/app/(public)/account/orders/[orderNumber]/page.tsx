import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteDataSkeleton } from "@/components/shared/RouteDataSkeleton";

import { CustomerOrderDetail } from "@/features/order-tracking/components/CustomerOrderDetail";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = { title: "Order details", robots: privatePageRobots };
type CustomerOrderDetailPageProps = { params: Promise<{ orderNumber: string }> };
export default function CustomerOrderDetailPage(props: CustomerOrderDetailPageProps) {
  return <Suspense fallback={<RouteDataSkeleton title="Order details" />}><RequestedOrderDetail {...props} /></Suspense>;
}
async function RequestedOrderDetail({ params }: CustomerOrderDetailPageProps) {
  const { orderNumber } = await params;
  return <CustomerOrderDetail orderNumber={orderNumber} />;
}
