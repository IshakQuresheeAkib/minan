import { Suspense } from "react";
import { AdminOrders } from "@/features/admin/components/AdminOrders";
import { OrdersSkeleton } from "@/features/admin/components/AdminSkeleton";

export const metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <AdminOrders />
    </Suspense>
  );
}

