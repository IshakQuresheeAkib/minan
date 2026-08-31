import { Suspense } from "react";
import type { Metadata } from "next";

import { CustomerLoginForm } from "@/features/order-tracking/components/CustomerLoginForm";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Sign in to Orders",
  robots: privatePageRobots,
};

export default function CustomerLoginPage() {
  return (
    <section className="mx-auto flex min-h-[70dvh] w-full max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border bg-background p-6 shadow-sm">
        <p className="text-xs font-bold tracking-[0.18em] text-foreground/60 uppercase">MINAN account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Sign in to Orders</h1>
        <p className="mt-2 text-sm leading-6 text-foreground/70">Use your existing customer account. Registration is available only after MINAN completes email verification.</p>
        <Suspense fallback={null}><CustomerLoginForm /></Suspense>
      </div>
    </section>
  );
}
