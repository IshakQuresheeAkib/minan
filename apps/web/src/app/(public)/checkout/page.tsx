import { CheckoutClient } from "@/features/checkout/components/CheckoutClient";
import { getCheckoutConfig } from "@/lib/api/server";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const config = await getCheckoutConfig().catch(() => null);
  return <CheckoutClient config={config} />;
}
