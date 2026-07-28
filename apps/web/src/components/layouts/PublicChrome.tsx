import { Suspense } from "react";
import type { ReactNode } from "react";

import {
  PublicFooterSlot,
  PublicNavbarSlot,
} from "@/components/layouts/PublicRouteChrome";
import { SpeculationRules } from "@/components/layouts/SpeculationRules";
import { Toaster } from "@/components/ui/sonner";

type PublicChromeProps = {
  children: ReactNode;
};

export function PublicChrome({ children }: PublicChromeProps) {
  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background focus:shadow-lg focus:outline-none"
      >
        Skip to content
      </a>
      <div className="relative mx-auto w-full overflow-x-clip shadow-[0_0_40px_rgba(0,0,0,0.05)]">
        <Suspense fallback={null}>
          <PublicNavbarSlot />
        </Suspense>
        <main id="main-content" tabIndex={-1} className="pb-24 outline-none lg:pb-0">
          {children}
        </main>
        <Suspense fallback={null}>
          <PublicFooterSlot />
        </Suspense>
        <SpeculationRules />
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
