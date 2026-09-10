"use client";

import { usePathname } from "next/navigation";

import {
  LimelightNav,
  type LimelightNavItem,
} from "@/components/ui/limelight-nav";
import {
  getActivePrimaryNavItemId,
  primaryNavItems,
} from "@/constants/nav-items";

export function NavPill() {
  const pathname = usePathname();
  const items = primaryNavItems.map<LimelightNavItem>((item) => ({
    ...item,
    icon: <item.icon />,
  }));
  const activeItemId = getActivePrimaryNavItemId(pathname);

  return (
    <LimelightNav
      activeItemId={activeItemId}
      className="hidden lg:flex"
      iconClassName="size-4"
      items={items}
      orientation="horizontal"
    />
  );
}
