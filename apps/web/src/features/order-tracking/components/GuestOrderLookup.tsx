"use client";

import { MailCheck } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  OrderTrackingApiError,
  requestGuestOrderOtp,
  verifyGuestOrderOtp,
} from "@/features/order-tracking/lib/orderTrackingApi";

type GuestOrderLookupProps = { initialOrderNumber?: string };

export function GuestOrderLookup({ initialOrderNumber = "" }: GuestOrderLookupProps) {
  const router = useRouter();
  const formId = useId();
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [otp, setOtp] = useState("");
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      await requestGuestOrderOtp({ email, orderNumber });
      setRequested(true);
    } catch (requestError) {
      setError(requestError instanceof OrderTrackingApiError ? requestError.message : "Unable to request an access code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendCode();
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyGuestOrderOtp({ email, orderNumber, otp });
      router.push(`/orders?order=${encodeURIComponent(orderNumber)}&access=guest`);
    } catch (verificationError) {
      setError(verificationError instanceof OrderTrackingApiError ? verificationError.message : "Unable to verify that code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (requested) {
    return (
      <form noValidate onSubmit={(event) => void verifyCode(event)} className="grid gap-4">
        <div className="rounded-xl border border-primary/35 bg-primary/10 p-3 text-sm leading-6 text-foreground" role="status">
          If the order details match, a six-digit code has been sent to that email address. কোডটি ইমেইলে পাঠানো হয়েছে।
        </div>
        <label className="grid gap-2 text-sm font-medium" htmlFor={`${formId}-otp`}>
          Email access code
          <Input id={`${formId}-otp`} autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} />
        </label>
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        <Button type="submit" loading={busy} loadingText="Verifying..." disabled={otp.length !== 6}>View this order</Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void sendCode()}>Send another code</Button>
      </form>
    );
  }

  return (
    <form noValidate onSubmit={(event) => void requestCode(event)} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium" htmlFor={`${formId}-order`}>
        Order number
        <Input id={`${formId}-order`} autoComplete="off" required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="MN-YYYYMMDD-####" />
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor={`${formId}-email`}>
        Email used at checkout
        <Input id={`${formId}-email`} autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
      </label>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <Button type="submit" loading={busy} loadingText="Sending code..." leftIcon={<MailCheck className="size-4" aria-hidden="true" />}>Email me a code</Button>
      <p className="text-xs leading-5 text-foreground/60">We use the code only to open this one order. No order history is attached from an email address.</p>
    </form>
  );
}
