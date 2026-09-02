import type { Metadata } from "next";

import { CustomerOrderHistory } from "@/features/order-tracking/components/CustomerOrderHistory";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = { title: "My Orders", robots: privatePageRobots };
export default function CustomerOrdersPage() { return <CustomerOrderHistory />; }
