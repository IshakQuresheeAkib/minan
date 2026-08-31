"use client";

import { CircleCheck, CircleX, Clock3, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";
import { retryCheckoutPayment } from "@/features/checkout/actions/checkout.actions";
import { clearCheckoutIdempotencyKey } from "@/features/checkout/lib/checkoutSession";
import { paymentResponseMatchesContract } from "@/features/checkout/lib/paymentContract";
import { shouldStripPaymentResultReference } from "@/features/checkout/lib/paymentResultReference";
import type { PaymentResult, PaymentStartResult } from "@/features/checkout/types";
import { ApiError } from "@/lib/api/client";
import { useBuyNowStore } from "@/store/buy-now.store";
import { useCartStore } from "@/store/cart.store";

function resultIcon(state: PaymentResult["state"]) {
  if (state === "completed")
    return (
      <CircleCheck className="size-14 text-emerald-600" aria-hidden="true" />
    );
  if (
    state === "verification_pending" ||
    state === "creating" ||
    state === "initiated"
  ) {
    return <Clock3 className="size-14 text-amber-600" aria-hidden="true" />;
  }
  return <CircleX className="size-14 text-destructive" aria-hidden="true" />;
}

function heading(state: PaymentResult["state"]): string {
  if (state === "completed") return "Payment confirmed";
  if (state === "verification_pending") return "Verification pending";
  if (state === "creating" || state === "initiated")
    return "Payment in progress";
  if (state === "cancelled") return "Payment cancelled";
  if (state === "unavailable") return "Result unavailable";
  return "Payment unsuccessful";
}

export function PaymentResultClient({ result }: { result: PaymentResult }) {
  const clearCart = useCartStore((state) => state.clearCart);
  const clearBuyNow = useBuyNowStore((state) => state.clearItem);
  const [retryToken, setRetryToken] = useState(result.retry_token ?? null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (shouldStripPaymentResultReference(result.state)) {
      window.history.replaceState(null, "", publicRoutes.paymentResult);
    }
    if (result.state !== "completed" || !result.checkout_source) return;
    if (result.checkout_source === "cart") clearCart();
    else clearBuyNow();
    clearCheckoutIdempotencyKey(result.checkout_source);
  }, [clearBuyNow, clearCart, result.checkout_source, result.state]);

  function continuePayment(next: PaymentStartResult): void {
    if (
      result.payment_method &&
      result.pay_now_amount !== undefined &&
      !paymentResponseMatchesContract(
        next,
        { version: 2, methods: ["bkash_full", "cod"] },
        result.payment_method,
        result.pay_now_amount,
      )
    ) {
      toast.error("The retry payment details did not match this Order. Return to checkout and review the payment method.");
      return;
    }
    if (next.state === "redirect") {
      window.location.assign(next.bkash_url);
      return;
    }
    if (next.state === "completed") {
      window.location.assign(
        `${publicRoutes.paymentResult}?reference=${encodeURIComponent(next.reference)}`,
      );
      return;
    }
    if (next.state === "failed") {
      setRetryToken(next.retry_token);
      toast.error(next.message);
      return;
    }
    toast.info("Your payment is being prepared. Please try again shortly.");
  }

  async function retry() {
    if (!retryToken) return;
    setRetrying(true);
    try {
      const response = await retryCheckoutPayment(retryToken);
      continuePayment(response.data);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Payment retry failed.",
      );
    } finally {
      setRetrying(false);
    }
  }

  const checkoutHref =
    result.checkout_source === "buy_now"
      ? publicRoutes.buyNowCheckout
      : publicRoutes.checkout;
  const canRecheck =
    result.state === "verification_pending" || result.state === "initiated";

  return (
    <section className="mx-auto flex min-h-[65dvh] w-full max-w-2xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      {resultIcon(result.state)}
      <h1 className="mt-5 text-3xl font-semibold tracking-normal">
        {heading(result.state)}
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-foreground/70">
        {result.message}
      </p>
      {result.financial_review_required ? (
        <p
          className="mt-4 w-full max-w-lg rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm font-medium text-foreground"
          role="alert"
        >
          Do not make another payment for this Order. MINAN support must review
          the payment record first.
        </p>
      ) : null}
      {result.order_number ||
      result.fee_paid !== undefined ? (
        <dl className="mt-6 grid w-full max-w-md gap-3 border-y py-4 text-sm">
          {result.order_number ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/65">Order</dt>
              <dd className="font-medium">{result.order_number}</dd>
            </div>
          ) : null}
          {result.fee_paid !== undefined ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/65">Delivery fee paid</dt>
              <dd className="font-medium">
                Tk {result.fee_paid.toLocaleString("en-BD")}
              </dd>
            </div>
          ) : null}
          {result.payment_method ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/65">Payment method</dt>
              <dd className="font-medium">
                {result.payment_method === "bkash_full"
                  ? "bKash — full payment"
                  : "Cash on Delivery"}
              </dd>
            </div>
          ) : null}
          {result.merchandise_paid_online !== undefined ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/65">Merchandise paid online</dt>
              <dd className="font-medium">
                Tk {result.merchandise_paid_online.toLocaleString("en-BD")}
              </dd>
            </div>
          ) : null}
          {result.cod_due !== undefined ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/65">Remaining Cash on Delivery</dt>
              <dd className="font-medium">
                Tk {result.cod_due.toLocaleString("en-BD")}
              </dd>
            </div>
          ) : null}
          {result.merchant_invoice_number ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/65">Invoice</dt>
              <dd className="break-all text-right font-medium">
                {result.merchant_invoice_number}
              </dd>
            </div>
          ) : null}
          {result.bkash_trx_id ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/65">bKash transaction</dt>
              <dd className="break-all text-right font-medium">
                {result.bkash_trx_id}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {result.state === "completed" ? (
        <>
          <p className="mt-5 text-sm font-medium text-foreground/70">
            {result.payment_method === "bkash_full"
              ? "Your merchandise and delivery fee are paid. The delivery fee remains non-refundable."
              : "The delivery fee is non-refundable. Pay the merchandise balance in cash on delivery."}
          </p>
          {result.order_number ? (
            <section className="mt-6 w-full max-w-lg rounded-xl border border-primary/40 bg-primary/10 p-4 text-left">
              <h2 className="font-semibold">Track this order</h2>
              <p className="mt-1 text-sm leading-6 text-foreground/70">Use an email code to open this order. If you already have a MINAN account, you can sign in after verification to save only this order.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button href={`${publicRoutes.orderTracking}?order=${encodeURIComponent(result.order_number)}`} size="sm">Track order</Button>
                <Button href={`${publicRoutes.customerLogin}?next=${encodeURIComponent(`${publicRoutes.orderTracking}?order=${encodeURIComponent(result.order_number)}`)}`} size="sm" variant="secondary">Sign in to Orders</Button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {canRecheck ? (
          <Button
            type="button"
            leftIcon={<RotateCw className="size-4" aria-hidden="true" />}
            onClick={() => window.location.reload()}
          >
            Check again
          </Button>
        ) : null}
        {retryToken ? (
          <Button
            type="button"
            leftIcon={<RotateCw className="size-4" aria-hidden="true" />}
            loading={retrying}
            loadingText="Retrying..."
            onClick={() => void retry()}
          >
            Retry {result.payment_method === "bkash_full" ? "full" : "delivery-fee"} payment
          </Button>
        ) : null}
        <Button
          href={
            result.state === "completed" ? publicRoutes.products : checkoutHref
          }
          variant="secondary"
        >
          {result.state === "completed"
            ? "Continue shopping"
            : "Return to checkout"}
        </Button>
      </div>
    </section>
  );
}
