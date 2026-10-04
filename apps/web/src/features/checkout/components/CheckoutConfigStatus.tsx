"use client";

type CheckoutConfigStatusProps = {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
};

export function CheckoutConfigStatus({ loading, error, onRetry }: CheckoutConfigStatusProps) {
  if (loading) return <p role="status" className="mt-3 text-sm text-foreground/70">Loading delivery and payment options…</p>;
  if (!error) return null;
  return (
    <div role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <p>Checkout pricing is temporarily unavailable. Your details are still here.</p>
      <button type="button" onClick={onRetry} className="mt-2 cursor-pointer font-semibold underline underline-offset-4 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
        Retry checkout pricing
      </button>
    </div>
  );
}
