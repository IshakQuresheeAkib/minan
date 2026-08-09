import type { Metadata } from "next";

import { AdminLoginPanel } from "@/features/admin/components/AdminLoginPanel";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: privatePageRobots,
};

export default function AdminLoginPage() {
  return <AdminLoginPanel />;
}
