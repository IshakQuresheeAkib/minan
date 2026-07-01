import { Types } from "mongoose";

import { sendMetaCapiEvent } from "../lib/metaCapi.js";
import { AnalyticsEvent } from "../models/AnalyticsEvent.js";
import type {
  AnalyticsEventInput,
  WhatsappClickInput,
} from "../schemas/analytics.schemas.js";

type LogAnalyticsOptions = {
  clientUserAgent?: string;
  eventSourceUrl?: string;
};

function toObjectId(value: string | undefined): Types.ObjectId | undefined {
  if (!value || !Types.ObjectId.isValid(value)) {
    return undefined;
  }

  return new Types.ObjectId(value);
}

async function persistAnalyticsEvent(
  input: AnalyticsEventInput,
): Promise<void> {
  const existing = await AnalyticsEvent.findOne({ event_id: input.event_id })
    .select("_id")
    .lean();

  if (existing) {
    return;
  }

  await AnalyticsEvent.create({
    event_type: input.event_type,
    event_id: input.event_id,
    session_id: input.session_id,
    product_id: toObjectId(input.product_id),
    category_id: toObjectId(input.category_id),
    utm_source: input.utm_source,
    utm_medium: input.utm_medium,
    utm_campaign: input.utm_campaign,
  });
}

const PIXEL_EVENT_NAMES: Partial<
  Record<AnalyticsEventInput["event_type"], string>
> = {
  product_view: "ViewContent",
  add_to_cart: "AddToCart",
  checkout_start: "InitiateCheckout",
  whatsapp_click: "Lead",
  lead_submit: "Lead",
};

export async function logAnalyticsEvent(
  input: AnalyticsEventInput,
  options: LogAnalyticsOptions = {},
): Promise<void> {
  await persistAnalyticsEvent(input);

  const eventName = PIXEL_EVENT_NAMES[input.event_type];
  if (!eventName) {
    return;
  }

  await sendMetaCapiEvent(
    {
      eventName,
      eventId: input.event_id,
      eventSourceUrl: options.eventSourceUrl,
    },
    { clientUserAgent: options.clientUserAgent },
  );
}

export async function logWhatsappClick(
  input: WhatsappClickInput,
  options: LogAnalyticsOptions = {},
): Promise<void> {
  await logAnalyticsEvent(
    {
      event_type: "whatsapp_click",
      event_id: input.event_id,
      session_id: input.session_id,
      product_id: input.product_id,
      category_id: input.category_id,
      utm_source: input.utm_source,
      utm_medium: input.utm_medium,
      utm_campaign: input.utm_campaign,
    },
    options,
  );
}
