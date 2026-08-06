import type { ReactNode } from "react";

import { AdminSessionProvider } from "@/features/admin/components/AdminSessionProvider";
import { AdminShell } from "@/components/layouts/AdminShell";
import { Toaster } from "@/components/ui/sonner";
import { OrdersNotificationProvider } from "@/features/admin/components/OrdersNotificationProvider";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminSessionProvider>
      <OrdersNotificationProvider>
        <AdminShell>{children}</AdminShell>
        <Toaster richColors position="top-right" />
      </OrdersNotificationProvider>
    </AdminSessionProvider>
  );
}
