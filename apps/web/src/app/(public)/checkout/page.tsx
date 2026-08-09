import type { Metadata } from "next";

import { CheckoutClient } from "@/features/checkout/components/CheckoutClient";
import { getCheckoutConfig } from "@/lib/api/server";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Checkout",
  robots: privatePageRobots,
};

export default async function CheckoutPage() {
  const config = await getCheckoutConfig().catch(() => null);
  return <CheckoutClient config={config} />;
}
