import type { Metadata } from "next";

import { BuyNowCheckoutClient } from "@/features/checkout/components/BuyNowCheckoutClient";
import { getCheckoutConfig } from "@/lib/api/server";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Buy Now Checkout",
  robots: privatePageRobots,
};

export default async function BuyNowCheckoutPage() {
  const config = await getCheckoutConfig().catch(() => null);
  return <BuyNowCheckoutClient config={config} />;
}
