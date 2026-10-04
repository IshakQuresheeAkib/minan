import type { Metadata } from "next";

import { CheckoutClient } from "@/features/checkout/components/CheckoutClient";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Checkout",
  robots: privatePageRobots,
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
