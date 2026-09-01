"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { loginCustomer, OrderTrackingApiError } from "@/features/order-tracking/lib/orderTrackingApi";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

function getSafeNextPath(value: string | null): string {
  return value?.startsWith("/orders") ? value : "/orders";
}

export function CustomerLoginForm() {
  const formId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useCustomerAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await loginCustomer({ email, password });
      setSession(session);
      router.push(getSafeNextPath(searchParams.get("next")));
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof OrderTrackingApiError ? loginError.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate className="mt-6 grid gap-4" onSubmit={(event) => void submit(event)}>
      <label className="grid gap-2 text-sm font-medium" htmlFor={`${formId}-email`}>
        Email
        <Input id={`${formId}-email`} autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor={`${formId}-password`}>
        Password
        <span className="relative">
          <Input id={`${formId}-password`} autoComplete="current-password" required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="pr-12" />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50">
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </span>
      </label>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <Button type="submit" loading={busy} loadingText="Signing in...">Sign in to Orders</Button>
    </form>
  );
}
