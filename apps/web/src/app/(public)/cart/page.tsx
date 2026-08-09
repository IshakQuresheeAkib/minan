import type { Metadata } from "next";

import { CartPageContent } from "@/features/cart/components/CartPageContent";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Cart",
  robots: privatePageRobots,
};

export default function CartPage() {
  return <CartPageContent />;
}
