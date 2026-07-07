import type { ReactNode } from "react";
import { Suspense } from "react";

import { PublicChrome } from "@/components/layouts/PublicChrome";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <Suspense fallback={<PublicChromeFallback>{children}</PublicChromeFallback>}>
      <PublicChrome>{children}</PublicChrome>
    </Suspense>
  );
}

function PublicChromeFallback({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="relative mx-auto w-full overflow-x-clip shadow-[0_0_40px_rgba(0,0,0,0.05)]">
        <main className="pb-24 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
