"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { loginAdmin } from "@/features/admin/actions/auth.actions";
import {
  loginSchema,
  type LoginInput,
} from "@/features/admin/schemas/login.schema";
import { adminRoutes, publicRoutes } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitError(null);

    try {
      const session = await loginAdmin(values);
      setSession({
        accessToken: session.accessToken,
      });

      const nextPath = searchParams.get("next");
      const destination =
        nextPath &&
        nextPath.startsWith("/admin") &&
        nextPath !== publicRoutes.adminLogin
          ? nextPath
          : adminRoutes.dashboard;

      router.push(destination);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Unable to sign in. Please try again.");
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          autoComplete="email"
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          type="email"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <span className="text-xs font-normal text-destructive">
            {form.formState.errors.email.message}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          autoComplete="current-password"
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          type="password"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <span className="text-xs font-normal text-destructive">
            {form.formState.errors.password.message}
          </span>
        ) : null}
      </label>

      {submitError ? (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}

      <Button
        className="mt-2 w-full"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
