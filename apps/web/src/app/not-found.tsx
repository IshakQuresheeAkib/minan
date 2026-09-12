import type { Metadata } from "next";

import { NotFound } from "@/components/ui/not-found";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFoundPage() {
  return <NotFound />;
}
