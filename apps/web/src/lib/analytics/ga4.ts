import { env } from "@/config/env";
import { isGa4Allowed } from "@/lib/analytics/routes";

const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

export type Ga4Item = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_variant?: string;
};

type CommerceEvent = "view_item" | "add_to_cart" | "remove_from_cart" | "begin_checkout";

type Ga4Window = Window & {
  gtag?: (...args: unknown[]) => void;
  minanGa4Ready?: boolean;
  minanGa4Pending?: Array<[string, string, Record<string, unknown>]>;
};

export function markGa4Ready(): void {
  if (typeof window === "undefined") return;
  const scope = window as Ga4Window;
  if (typeof scope.gtag !== "function") return;
  scope.minanGa4Ready = true;
  for (const event of scope.minanGa4Pending ?? []) {
    scope.gtag(...event);
  }
  scope.minanGa4Pending = [];
}

export function toGa4Item(item: {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}): Ga4Item {
  const variant = [item.size, item.color].filter((part) => part && part !== "N/A").join(" / ");
  return {
    item_id: item.productId,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
    ...(variant ? { item_variant: variant } : {}),
  };
}

export function getGa4MeasurementId(value: string): string | null {
  const measurementId = value.trim();

  return GA4_MEASUREMENT_ID_PATTERN.test(measurementId)
    ? measurementId
    : null;
}

export function trackGa4CommerceEvent(
  name: CommerceEvent,
  items: Ga4Item[],
): boolean {
  if (items.length === 0) return false;
  return queueGa4Event(name, {
    currency: "BDT",
    value: items.reduce((total, item) => total + item.price * item.quantity, 0),
    items,
  });
}

export function trackGa4Purchase(payload: {
  transaction_id: string;
  value: number;
  shipping: number;
  items: Ga4Item[];
}): boolean {
  if (!payload.transaction_id || payload.items.length === 0) return false;
  return queueGa4Event("purchase", { currency: "BDT", ...payload });
}

function queueGa4Event(name: string, parameters: Record<string, unknown>): boolean {
  if (typeof window === "undefined") return false;
  const measurementId = getGa4MeasurementId(env.ga4Id);
  if (!measurementId || !isGa4Allowed(window.location.pathname)) return false;
  const scope = window as Ga4Window;
  if ((scope as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] === true) return false;
  let pageReferrer: string | undefined;
  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      pageReferrer = referrer.origin + referrer.pathname;
    } catch {
      // Ignore malformed browser referrers rather than sending an unsafe value.
    }
  }
  const event: [string, string, Record<string, unknown>] = ["event", name, {
    send_to: measurementId,
    page_location: window.location.origin + window.location.pathname,
    ...(pageReferrer ? { page_referrer: pageReferrer } : {}),
    ...parameters,
  }];
  if (!scope.minanGa4Ready) {
    scope.minanGa4Pending = scope.minanGa4Pending ?? [];
    scope.minanGa4Pending.push(event);
    return true;
  }
  scope.gtag?.(...event);
  return true;
}
