import type {
  CustomerOrderStatus,
  CustomerOrderTracking,
} from "@/features/order-tracking/lib/types";

const fulfillmentStages = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
] as const satisfies readonly CustomerOrderStatus[];

const stageCopy: Record<CustomerOrderStatus, { label: string; helperTextBn: string }> = {
  new: { label: "Order placed", helperTextBn: "আপনার অর্ডারটি গ্রহণ করা হয়েছে।" },
  confirmed: { label: "Confirmed", helperTextBn: "আপনার অর্ডার নিশ্চিত করা হয়েছে।" },
  processing: { label: "Processing", helperTextBn: "আপনার অর্ডার প্রস্তুত করা হচ্ছে।" },
  shipped: { label: "Shipped", helperTextBn: "আপনার অর্ডার কুরিয়ারের কাছে দেওয়া হয়েছে।" },
  delivered: { label: "Delivered", helperTextBn: "আপনার অর্ডার পৌঁছে দেওয়া হয়েছে।" },
  on_hold: { label: "On hold", helperTextBn: "আপনার অর্ডারটি সাময়িকভাবে অপেক্ষমাণ আছে।" },
  cancelled: { label: "Cancelled", helperTextBn: "আপনার অর্ডারটি বাতিল করা হয়েছে।" },
  returned: { label: "Returned", helperTextBn: "আপনার অর্ডারের রিটার্ন আপডেট করা হয়েছে।" },
  exchanged: { label: "Exchanged", helperTextBn: "আপনার অর্ডারের এক্সচেঞ্জ আপডেট করা হয়েছে।" },
};

export type TrackingJourneyEntry = {
  stage: CustomerOrderStatus;
  label: string;
  helperTextBn: string;
  state: "complete" | "current" | "upcoming";
  createdAt: string | null;
  customerNote: string | null;
};

function latestEntryFor(
  order: CustomerOrderTracking,
  stage: CustomerOrderStatus,
) {
  for (let index = order.timeline.length - 1; index >= 0; index -= 1) {
    const entry = order.timeline[index];
    if (entry?.stage === stage) return entry;
  }
  return undefined;
}

function entryFor(
  order: CustomerOrderTracking,
  stage: CustomerOrderStatus,
  state: TrackingJourneyEntry["state"],
): TrackingJourneyEntry {
  const timelineEntry = latestEntryFor(order, stage);
  const copy = timelineEntry
    ? { helperTextBn: timelineEntry.helper_text_bn, label: timelineEntry.label }
    : stage === order.current_stage.code
      ? { helperTextBn: order.current_stage.helper_text_bn, label: order.current_stage.label }
      : stageCopy[stage];

  return {
    ...copy,
    createdAt: timelineEntry?.created_at ?? null,
    customerNote: timelineEntry?.customer_note ?? null,
    stage,
    state,
  };
}

export function buildTrackingJourney(order: CustomerOrderTracking): TrackingJourneyEntry[] {
  const currentFulfillmentIndex = fulfillmentStages.indexOf(
    order.current_stage.code as (typeof fulfillmentStages)[number],
  );

  if (currentFulfillmentIndex >= 0) {
    return fulfillmentStages.map((stage, index) => entryFor(
      order,
      stage,
      index < currentFulfillmentIndex
        ? "complete"
        : index === currentFulfillmentIndex
          ? "current"
          : "upcoming",
    ));
  }

  const completedFulfillmentStages = fulfillmentStages.filter((stage) =>
    order.timeline.some((entry) => entry.stage === stage),
  );
  return [
    ...completedFulfillmentStages.map((stage) => entryFor(order, stage, "complete")),
    entryFor(order, order.current_stage.code, "current"),
  ];
}

export function formatTrackingDate(value: string): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = isDateOnly ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
  const parts = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;
  return day && month && year ? `${day} ${month} ${year}` : value;
}

export function formatBdt(value: number): string {
  return `Tk ${value.toLocaleString("en-BD")}`;
}

export function getOrderTrackingLoginHref(
  access: "guest" | "account",
  orderNumber: string,
): string {
  const next = `/orders?order=${encodeURIComponent(orderNumber)}&access=${access}`;
  return `/account/login?next=${encodeURIComponent(next)}`;
}
