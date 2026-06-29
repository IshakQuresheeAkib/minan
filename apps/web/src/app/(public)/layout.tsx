import type { ReactNode } from "react";

import { BottomNav } from "@/components/shared/bottom-nav";
import { Navbar } from "@/components/shared/navbar";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="relative mx-auto w-full max-w-screen-sm shadow-[0_0_40px_rgba(0,0,0,0.05)] lg:max-w-none lg:shadow-none">
        <Navbar />
        <main className="px-4 pb-28 pt-3 lg:px-0 lg:pb-0 lg:pt-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
