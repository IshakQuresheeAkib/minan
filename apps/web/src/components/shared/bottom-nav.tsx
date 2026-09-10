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

export function BottomNav() {
  const pathname = usePathname();
  const items = primaryNavItems.map<LimelightNavItem>((item) => ({
    ...item,
    icon: <item.icon />,
    prefetch: false,
  }));
  const activeItemId = getActivePrimaryNavItemId(pathname);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
      <LimelightNav
        activeItemId={activeItemId}
        className="pointer-events-auto max-w-md"
        items={items}
      />
    </div>
  );
}
