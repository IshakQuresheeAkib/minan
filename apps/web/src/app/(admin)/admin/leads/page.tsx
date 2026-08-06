import { redirect } from "next/navigation";
import { adminRoutes } from "@/constants/routes";

export const metadata = {
  title: "Leads",
};

export default function AdminLeadsPage() {
  redirect(adminRoutes.orders);
}
