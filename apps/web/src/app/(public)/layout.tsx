import type { ReactNode } from "react";

import { PublicChrome } from "@/components/layouts/PublicChrome";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <PublicChrome>{children}</PublicChrome>;
}
