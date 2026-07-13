import { Suspense } from "react";
import type { ReactNode } from "react";

import {
  PublicFooterSlot,
  PublicNavbarSlot,
} from "@/components/layouts/PublicRouteChrome";
import { Toaster } from "@/components/ui/sonner";

type PublicChromeProps = {
  children: ReactNode;
};

export function PublicChrome({ children }: PublicChromeProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="relative mx-auto w-full overflow-x-clip shadow-[0_0_40px_rgba(0,0,0,0.05)]">
        <Suspense fallback={null}>
          <PublicNavbarSlot />
        </Suspense>
        <main className="pb-24 lg:pb-0">{children}</main>
        <Suspense fallback={null}>
          <PublicFooterSlot />
        </Suspense>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
