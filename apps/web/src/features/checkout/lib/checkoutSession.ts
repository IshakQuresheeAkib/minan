import type {
  CartSnapshot,
  CheckoutSource,
} from "@/features/checkout/types";
import type { LeadInput } from "@/features/checkout/schemas/lead.schema";

function storageKey(source: CheckoutSource): string {
  return `minan-checkout-idempotency-${source}`;
}

export function getCheckoutIdempotencyKey(
  source: CheckoutSource,
  cartSnapshot: CartSnapshot,
  customer: LeadInput,
): string {
  const key = storageKey(source);
  const existing = sessionStorage.getItem(key);
  const fingerprint = JSON.stringify({
    customer,
    items: cartSnapshot.items.map((item) => ({
      product_id: item.product_id,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    })),
  });
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as {
        id?: unknown;
        fingerprint?: unknown;
      };
      if (typeof parsed.id === "string" && parsed.fingerprint === fingerprint) {
        return parsed.id;
      }
    } catch {
      // Replace legacy or malformed session data below.
    }
  }
  const created = crypto.randomUUID();
  sessionStorage.setItem(key, JSON.stringify({ id: created, fingerprint }));
  return created;
}

export function clearCheckoutIdempotencyKey(source: CheckoutSource): void {
  sessionStorage.removeItem(storageKey(source));
}
