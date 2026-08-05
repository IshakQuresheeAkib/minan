import { BuyNowCheckoutClient } from "@/features/checkout/components/BuyNowCheckoutClient";
import { getCheckoutConfig } from "@/lib/api/server";

export const metadata = {
  title: "Buy Now Checkout",
};

export default async function BuyNowCheckoutPage() {
  const config = await getCheckoutConfig().catch(() => null);
  return <BuyNowCheckoutClient config={config} />;
}
