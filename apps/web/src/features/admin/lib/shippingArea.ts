import type { AdminOrder } from "@/features/admin/types";

export function shippingAreaLabel(
  zone: AdminOrder["shipping_zone"],
): string {
  if (zone === "inside_sylhet") return "Inside Sylhet";
  if (zone === "outside_sylhet") return "Outside Sylhet";
  return "Legacy / unspecified";
}
