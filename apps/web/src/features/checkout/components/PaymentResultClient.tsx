"use client";

import { CircleCheck, CircleX, Clock3, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";
import { retryCheckoutPayment } from "@/features/checkout/actions/checkout.actions";
import { clearCheckoutIdempotencyKey } from "@/features/checkout/lib/checkoutSession";
import type { PaymentResult, PaymentStartResult } from "@/features/checkout/types";
import { ApiError } from "@/lib/api/client";
import { useBuyNowStore } from "@/store/buy-now.store";
import { useCartStore } from "@/store/cart.store";

function resultIcon(state: PaymentResult["state"]) {
  if (state === "completed") return <CircleCheck className="size-14 text-emerald-600" aria-hidden="true" />;
  if (state === "verification_pending" || state === "creating" || state === "initiated") {
    return <Clock3 className="size-14 text-amber-600" aria-hidden="true" />;
  }
  return <CircleX className="size-14 text-destructive" aria-hidden="true" />;
}

function heading(state: PaymentResult["state"]): string {
  if (state === "completed") return "Payment confirmed";
  if (state === "verification_pending") return "Verification pending";
  if (state === "creating" || state === "initiated") return "Payment in progress";
  if (state === "cancelled") return "Payment cancelled";
  if (state === "unavailable") return "Result unavailable";
  return "Payment unsuccessful";
}

export function PaymentResultClient({ result }: { result: PaymentResult }) {
  const clearCart = useCartStore((state) => state.clearCart);
  const clearBuyNow = useBuyNowStore((state) => state.clearItem);
  const [retryToken, setRetryToken] = useState(result.retry_token ?? null);
  const [updatedTotal, setUpdatedTotal] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, "", publicRoutes.paymentResult);
    if (result.state !== "completed" || !result.checkout_source) return;
    if (result.checkout_source === "cart") clearCart();
    else clearBuyNow();
    clearCheckoutIdempotencyKey(result.checkout_source);
  }, [clearBuyNow, clearCart, result.checkout_source, result.state]);

  function continuePayment(next: PaymentStartResult): void {
    if (next.state === "redirect") {
      window.location.assign(next.bkash_url);
      return;
    }
    if (next.state === "completed") {
      window.location.assign(`${publicRoutes.paymentResult}?reference=${encodeURIComponent(next.reference)}`);
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
      const response = await retryCheckoutPayment(
        retryToken,
        updatedTotal ?? undefined,
      );
      if (response.data.state === "price_changed") {
        setRetryToken(response.data.retry_token);
        setUpdatedTotal(response.data.total);
      } else {
        continuePayment(response.data);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Payment retry failed.");
    } finally {
      setRetrying(false);
    }
  }

  const checkoutHref = result.checkout_source === "buy_now"
    ? publicRoutes.buyNowCheckout
    : publicRoutes.checkout;

  return (
    <section className="mx-auto flex min-h-[65dvh] w-full max-w-2xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      {resultIcon(result.state)}
      <h1 className="mt-5 text-3xl font-semibold tracking-normal">{heading(result.state)}</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-foreground/70">{result.message}</p>
      {result.amount !== undefined ? (
        <dl className="mt-6 grid w-full max-w-md gap-3 border-y py-4 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-foreground/65">Amount</dt><dd className="font-medium">Tk {result.amount.toLocaleString("en-BD")}</dd></div>
          {result.merchant_invoice_number ? <div className="flex justify-between gap-4"><dt className="text-foreground/65">Invoice</dt><dd className="break-all text-right font-medium">{result.merchant_invoice_number}</dd></div> : null}
          {result.bkash_trx_id ? <div className="flex justify-between gap-4"><dt className="text-foreground/65">bKash transaction</dt><dd className="break-all text-right font-medium">{result.bkash_trx_id}</dd></div> : null}
        </dl>
      ) : null}
      {updatedTotal !== null ? (
        <p className="mt-5 text-sm text-foreground/75">The current total is Tk {updatedTotal.toLocaleString("en-BD")}. Confirm it to continue.</p>
      ) : null}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {retryToken ? (
          <Button
            type="button"
            leftIcon={<RotateCw className="size-4" aria-hidden="true" />}
            loading={retrying}
            loadingText="Retrying..."
            onClick={() => void retry()}
          >
            {updatedTotal === null ? "Retry payment" : "Confirm and pay"}
          </Button>
        ) : null}
        <Button href={result.state === "completed" ? publicRoutes.products : checkoutHref} variant="secondary">
          {result.state === "completed" ? "Continue shopping" : "Return to checkout"}
        </Button>
      </div>
    </section>
  );
}
