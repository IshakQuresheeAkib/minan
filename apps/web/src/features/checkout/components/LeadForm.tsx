"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  retryCheckoutPayment,
  startCheckoutPayment,
} from "@/features/checkout/actions/checkout.actions";
import { getCheckoutIdempotencyKey } from "@/features/checkout/lib/checkoutSession";
import {
  leadInputSchema,
  type LeadInput,
} from "@/features/checkout/schemas/lead.schema";
import type {
  CartSnapshot,
  CheckoutSource,
  PaymentStartResult,
} from "@/features/checkout/types";
import { ApiError } from "@/lib/api/client";

type LeadFormProps = {
  cartSnapshot: CartSnapshot;
  checkoutSource: CheckoutSource;
  disabled?: boolean;
  deliveryFee: number;
};

export function LeadForm({
  cartSnapshot,
  checkoutSource,
  disabled = false,
  deliveryFee,
}: LeadFormProps) {
  const formId = useId();
  const [retryToken, setRetryToken] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const form = useForm<LeadInput>({
    resolver: zodResolver(leadInputSchema),
    defaultValues: {
      name: "",
      phone_number: "",
      email: "",
      address: "",
      notes: "",
    },
  });
  const errors = form.formState.errors;
  const errorIds = {
    address: `${formId}-address-error`,
    email: `${formId}-email-error`,
    name: `${formId}-name-error`,
    notes: `${formId}-notes-error`,
    phone_number: `${formId}-phone-number-error`,
  };

  function handlePaymentResult(result: PaymentStartResult): void {
    if (result.state === "redirect") {
      window.location.assign(result.bkash_url);
      return;
    }
    if (result.state === "completed") {
      window.location.assign(
        `/payment/result?reference=${encodeURIComponent(result.reference)}`,
      );
      return;
    }
    if (result.state === "failed") {
      setRetryToken(result.retry_token);
      toast.error(result.message);
      return;
    }
    toast.info("Your payment is being prepared. Please try again shortly.");
  }

  async function onSubmit(values: LeadInput) {
    try {
      const response = await startCheckoutPayment(
        {
          ...values,
          cart_snapshot: cartSnapshot,
          checkout_source: checkoutSource,
        },
        getCheckoutIdempotencyKey(checkoutSource, cartSnapshot, values),
      );
      handlePaymentResult(response.data);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to start bKash payment.",
      );
    }
  }

  async function onRetry() {
    if (!retryToken) return;
    setRetrying(true);
    try {
      const response = await retryCheckoutPayment(retryToken);
      handlePaymentResult(response.data);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to retry payment.",
      );
    } finally {
      setRetrying(false);
    }
  }

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
    >
      <label className="grid gap-2 text-sm font-medium">
        Name
        <Input
          aria-describedby={errors.name ? errorIds.name : undefined}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          {...form.register("name")}
        />
        {errors.name ? <span id={errorIds.name} className="text-xs text-destructive" role="alert">{errors.name.message}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Phone Number
        <Input
          aria-describedby={errors.phone_number ? errorIds.phone_number : undefined}
          aria-invalid={Boolean(errors.phone_number)}
          autoComplete="tel"
          inputMode="tel"
          {...form.register("phone_number")}
        />
        {errors.phone_number ? <span id={errorIds.phone_number} className="text-xs text-destructive" role="alert">{errors.phone_number.message}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <Input
          type="email"
          aria-describedby={errors.email ? errorIds.email : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          {...form.register("email")}
        />
        {errors.email ? <span id={errorIds.email} className="text-xs text-destructive" role="alert">{errors.email.message}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Address
        <Textarea
          className="min-h-28"
          aria-describedby={errors.address ? errorIds.address : undefined}
          aria-invalid={Boolean(errors.address)}
          autoComplete="street-address"
          {...form.register("address")}
        />
        {errors.address ? <span id={errorIds.address} className="text-xs text-destructive" role="alert">{errors.address.message}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Notes
        <Textarea
          className="min-h-24"
          aria-describedby={errors.notes ? errorIds.notes : undefined}
          aria-invalid={Boolean(errors.notes)}
          {...form.register("notes")}
        />
        {errors.notes ? <span id={errorIds.notes} className="text-xs text-destructive" role="alert">{errors.notes.message}</span> : null}
      </label>
      <Button
        className="mt-2 h-11 w-full"
        type="submit"
        disabled={disabled}
        loading={form.formState.isSubmitting}
        loadingText="Opening bKash..."
      >
        Pay Tk {deliveryFee.toLocaleString("en-BD")} delivery fee with bKash
      </Button>
      <p className="text-sm font-medium text-foreground/70">
        The Tk {deliveryFee.toLocaleString("en-BD")} delivery fee is non-refundable. Merchandise is payable by cash on delivery.
      </p>
      {retryToken ? (
        <div className="grid gap-3" role="status">
          <Button
            type="button"
            variant="secondary"
            loading={retrying}
            loadingText="Retrying..."
            onClick={() => void onRetry()}
          >
            Retry delivery-fee payment
          </Button>
        </div>
      ) : null}
    </form>
  );
}
