"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  retryCheckoutPayment,
  startCheckoutPayment,
} from "@/features/checkout/actions/checkout.actions";
import { ShippingMethodSelector } from "@/features/checkout/components/ShippingMethodSelector";
import { PaymentMethodSelector } from "@/features/checkout/components/PaymentMethodSelector";
import { getCheckoutIdempotencyKey } from "@/features/checkout/lib/checkoutSession";
import {
  getPaymentSplit,
  paymentResponseMatchesContract,
} from "@/features/checkout/lib/paymentContract";
import {
  getLeadInputSchema,
  type LeadInput,
} from "@/features/checkout/schemas/lead.schema";
import type {
  CartSnapshot,
  CheckoutPaymentContract,
  CheckoutSource,
  PaymentMethod,
  PaymentStartResult,
  ShippingOption,
  ShippingZone,
} from "@/features/checkout/types";
import { ApiError } from "@/lib/api/client";

type CheckoutFormProps = {
  cartSnapshot: CartSnapshot;
  checkoutSource: CheckoutSource;
  deliveryFee: number;
  disabled?: boolean;
  merchandiseTotal: number;
  onPaymentMethodChange: (method?: PaymentMethod) => void;
  onShippingZoneChange: (zone: ShippingZone) => void;
  paymentContract?: CheckoutPaymentContract;
  selectedShippingZone?: ShippingZone;
  shippingOptions: readonly ShippingOption[];
};

export function CheckoutForm({
  cartSnapshot,
  checkoutSource,
  deliveryFee,
  disabled = false,
  merchandiseTotal,
  onPaymentMethodChange,
  onShippingZoneChange,
  paymentContract,
  selectedShippingZone,
  shippingOptions,
}: CheckoutFormProps) {
  const formId = useId();
  const [retryContext, setRetryContext] = useState<{
    token: string;
    method: PaymentMethod;
    payNow: number;
  } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const usesShippingZones = shippingOptions.length > 0;
  const supportsPaymentChoice = paymentContract !== undefined;
  const validationSchema = useMemo(
    () => getLeadInputSchema(usesShippingZones, supportsPaymentChoice),
    [supportsPaymentChoice, usesShippingZones],
  );
  const form = useForm<LeadInput>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: "",
      phone_number: "",
      email: "",
      address: "",
      notes: "",
    },
  });
  const errors = form.formState.errors;
  const selectedPaymentMethod = useWatch({
    control: form.control,
    name: "payment_method",
  });
  const selectedOption = shippingOptions.find(
    (option) => option.id === selectedShippingZone,
  );
  const payableDeliveryFee = selectedOption?.delivery_fee ??
    (usesShippingZones ? undefined : deliveryFee);
  const errorIds = {
    address: `${formId}-address-error`,
    email: `${formId}-email-error`,
    name: `${formId}-name-error`,
    notes: `${formId}-notes-error`,
    phone_number: `${formId}-phone-number-error`,
    payment_method: `${formId}-payment-method-error`,
    shipping_zone: `${formId}-shipping-zone-error`,
  };

  function handlePaymentResult(
    result: PaymentStartResult,
    method: PaymentMethod,
    payNow: number,
  ): void {
    if (!paymentResponseMatchesContract(result, paymentContract, method, payNow)) {
      setRetryContext(null);
      toast.error(
        "Payment details changed before bKash opened. Refresh checkout and review the amounts before trying again.",
      );
      return;
    }
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
      setRetryContext({ token: result.retry_token, method, payNow });
      toast.error(result.message);
      return;
    }
    toast.info("Your payment is being prepared. Please try again shortly.");
  }

  async function onSubmit(values: LeadInput) {
    const paymentMethod = supportsPaymentChoice
      ? values.payment_method
      : "cod";
    if (!paymentMethod) return;
    const { payNow } = getPaymentSplit(
      paymentMethod,
      merchandiseTotal,
      payableDeliveryFee ?? deliveryFee,
    );
    try {
      const response = await startCheckoutPayment(
        {
          ...values,
          cart_snapshot: cartSnapshot,
          checkout_source: checkoutSource,
          payment_method: paymentMethod,
        },
        getCheckoutIdempotencyKey(checkoutSource, cartSnapshot, values),
      );
      handlePaymentResult(response.data, paymentMethod, payNow);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to start bKash payment.",
      );
    }
  }

  async function onRetry() {
    if (!retryContext) return;
    setRetrying(true);
    try {
      const response = await retryCheckoutPayment(retryContext.token);
      handlePaymentResult(
        response.data,
        retryContext.method,
        retryContext.payNow,
      );
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
      onSubmit={(event) =>
        void form.handleSubmit(onSubmit, (invalidFields) => {
          if (usesShippingZones && invalidFields.shipping_zone) {
            form.setFocus("shipping_zone");
          } else if (supportsPaymentChoice && invalidFields.payment_method) {
            form.setFocus("payment_method");
          }
        })(event)
      }
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
        Detailed Address
        <Textarea
          className="min-h-28"
          aria-describedby={errors.address ? errorIds.address : undefined}
          aria-invalid={Boolean(errors.address)}
          autoComplete="street-address"
          {...form.register("address")}
        />
        {errors.address ? <span id={errorIds.address} className="text-xs text-destructive" role="alert">{errors.address.message}</span> : null}
      </label>
      {usesShippingZones ? (
        <Controller
          control={form.control}
          name="shipping_zone"
          render={({ field }) => (
            <ShippingMethodSelector
              ref={field.ref}
              disabled={disabled || form.formState.isSubmitting || retrying}
              errorId={errorIds.shipping_zone}
              errorMessage={errors.shipping_zone?.message}
              name={field.name}
              onBlur={field.onBlur}
              onChange={(zone) => {
                field.onChange(zone);
                if (supportsPaymentChoice) {
                  form.setValue("payment_method", undefined);
                  form.clearErrors("payment_method");
                  onPaymentMethodChange(undefined);
                }
                setRetryContext(null);
                onShippingZoneChange(zone);
              }}
              options={shippingOptions}
              value={field.value}
            />
          )}
        />
      ) : null}
      {supportsPaymentChoice && payableDeliveryFee !== undefined ? (
        <Controller
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <PaymentMethodSelector
              ref={field.ref}
              deliveryFee={payableDeliveryFee}
              disabled={disabled || form.formState.isSubmitting || retrying}
              errorId={errorIds.payment_method}
              errorMessage={errors.payment_method?.message}
              merchandiseTotal={merchandiseTotal}
              name={field.name}
              onBlur={field.onBlur}
              onChange={(method) => {
                field.onChange(method);
                setRetryContext(null);
                onPaymentMethodChange(method);
              }}
              value={field.value}
            />
          )}
        />
      ) : null}
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
        disabled={disabled || retrying}
        loading={form.formState.isSubmitting}
        loadingText="Opening bKash..."
        leftIcon={<CircleCheck className="size-4" aria-hidden="true" />}
      >
        {supportsPaymentChoice
          ? selectedPaymentMethod
            ? `Pay Tk ${getPaymentSplit(
              selectedPaymentMethod,
              merchandiseTotal,
              payableDeliveryFee ?? deliveryFee,
            ).payNow.toLocaleString("en-BD")} with bKash`
            : "Select a payment method"
          : payableDeliveryFee
            ? `Pay Tk ${payableDeliveryFee.toLocaleString("en-BD")} delivery fee with bKash`
            : "Continue to bKash"}
      </Button>
      <p className="text-sm font-medium text-foreground/70">
        {supportsPaymentChoice
          ? "The delivery fee is non-refundable. Full bKash payments cover total order value. If you selected cash on delivery, you need to pay delivery fee in advance."
          : "The delivery fee is non-refundable. Merchandise is payable by cash on delivery."}
      </p>
      {retryContext ? (
        <div className="grid gap-3" role="status">
          <Button
            type="button"
            variant="secondary"
            loading={retrying}
            loadingText="Retrying..."
            onClick={() => void onRetry()}
          >
            Retry {retryContext.method === "bkash_full" ? "full" : "delivery-fee"} payment
          </Button>
        </div>
      ) : null}
    </form>
  );
}
