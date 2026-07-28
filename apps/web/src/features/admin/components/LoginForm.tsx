"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
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
  const formId = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const errors = form.formState.errors;
  const emailErrorId = `${formId}-email-error`;
  const passwordErrorId = `${formId}-password-error`;
  const submitErrorId = `${formId}-submit-error`;

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
    <form
      className="mt-6 grid gap-4"
      aria-describedby={submitError ? submitErrorId : undefined}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          aria-describedby={errors.email ? emailErrorId : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          type="email"
          {...form.register("email")}
        />
        {errors.email ? (
          <span
            id={emailErrorId}
            className="text-xs font-normal text-destructive"
            role="alert"
          >
            {errors.email.message}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          aria-describedby={errors.password ? passwordErrorId : undefined}
          aria-invalid={Boolean(errors.password)}
          autoComplete="current-password"
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          type="password"
          {...form.register("password")}
        />
        {errors.password ? (
          <span
            id={passwordErrorId}
            className="text-xs font-normal text-destructive"
            role="alert"
          >
            {errors.password.message}
          </span>
        ) : null}
      </label>

      {submitError ? (
        <p id={submitErrorId} className="text-sm text-destructive" role="alert">
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
