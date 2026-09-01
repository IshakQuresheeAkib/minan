import type { Metadata } from "next";

import { CustomerOrderDetail } from "@/features/order-tracking/components/CustomerOrderDetail";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = { title: "Order details", robots: privatePageRobots };
export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <CustomerOrderDetail orderNumber={orderNumber} />;
}
