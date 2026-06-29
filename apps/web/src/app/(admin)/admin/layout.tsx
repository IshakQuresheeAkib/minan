import type { ReactNode } from "react";

import { AdminSessionProvider } from "@/features/admin/components/AdminSessionProvider";
import { AdminShell } from "@/components/layouts/AdminShell";
import { Toaster } from "@/components/ui/sonner";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminSessionProvider>
      <AdminShell>{children}</AdminShell>
      <Toaster richColors position="top-right" />
    </AdminSessionProvider>
  );
}
