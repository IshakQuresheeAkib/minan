"use client";

import { Suspense } from "react";

import { LoginForm } from "@/features/admin/components/LoginForm";

function LoginFormFallback() {
  return (
    <div className="mt-6 h-40 animate-pulse rounded-md bg-muted" aria-hidden />
  );
}

export function AdminLoginPanel() {
  return (
    <section className="mx-auto flex min-h-[70dvh] w-full max-w-md items-center px-4 py-10">
      <div className="w-full rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal">Admin Login</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in with an active admin account.
        </p>
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
