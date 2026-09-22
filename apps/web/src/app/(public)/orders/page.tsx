import type { Metadata } from "next";

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

export default async function OrderTrackingPage({
  searchParams,
}: OrderTrackingPageProps) {
  const params = await searchParams;
  const orderNumber = typeof params.order === "string"
    ? params.order.trim()
    : "";

  return (
    <OrderTrackingExperience
      orderNumber={orderNumber}
    />
  );
}
