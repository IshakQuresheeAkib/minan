import type { Metadata } from "next";

import { OrderTrackingExperience } from "@/features/order-tracking/components/OrderTrackingExperience";
import type { OrderAccess } from "@/features/order-tracking/lib/types";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Order tracking",
  robots: privatePageRobots,
};

type OrderTrackingPageProps = {
  searchParams: Promise<{
    access?: string | string[];
    order?: string | string[];
  }>;
};

function isOrderAccess(
  value: string | string[] | undefined,
): value is OrderAccess {
  return value === "guest" || value === "account";
}

export default async function OrderTrackingPage({
  searchParams,
}: OrderTrackingPageProps) {
  const params = await searchParams;
  const orderNumber = typeof params.order === "string"
    ? params.order.trim()
    : "";
  const access = isOrderAccess(params.access) ? params.access : null;

  return (
    <OrderTrackingExperience
      access={access}
      orderNumber={orderNumber}
    />
  );
}
