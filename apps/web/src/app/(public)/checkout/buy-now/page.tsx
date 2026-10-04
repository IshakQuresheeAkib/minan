import type { Metadata } from "next";

import { BuyNowCheckoutClient } from "@/features/checkout/components/BuyNowCheckoutClient";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Buy Now Checkout",
  robots: privatePageRobots,
};

export default function BuyNowCheckoutPage() {
  return <BuyNowCheckoutClient />;
}
