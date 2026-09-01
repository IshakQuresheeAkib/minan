import { Suspense } from "react";
import type { Metadata } from "next";

import { OrderTrackingExperience } from "@/features/order-tracking/components/OrderTrackingExperience";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Order tracking",
  robots: privatePageRobots,
};

export default function OrderTrackingPage() {
  return <Suspense fallback={null}><OrderTrackingExperience /></Suspense>;
}
