import type { ReactNode } from "react";

import { AdminSessionProvider } from "@/features/admin/components/AdminSessionProvider";
import { AdminShell } from "@/components/layouts/AdminShell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminSessionProvider>
      <AdminShell>{children}</AdminShell>
    </AdminSessionProvider>
  );
}
