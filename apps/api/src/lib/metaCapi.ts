import { createHash } from "node:crypto";

import type { OrderDocument } from "../models/Order.js";

export function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function normalizeMetaPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `880${digits}`;
  return digits;
}

export function hashMetaEmail(email?: string): string | undefined {
  if (!email || !email.trim()) return undefined;
  return sha256(email);
}

export function hashMetaPhone(phone?: string): string | undefined {
  const normalized = normalizeMetaPhone(phone);
  return normalized ? sha256(normalized) : undefined;
}

export type MetaCapiCustomData = {
  value?: number;
  currency?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  num_items?: number;
  order_id?: string;
  content_name?: string;
  [key: string]: unknown;
};

export type MetaCapiUserData = {
  clientUserAgent?: string;
  clientIpAddress?: string;
  em?: string[];
  ph?: string[];
  fbp?: string;
  fbc?: string;
};

export type MetaCapiEventPayload = {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  customData?: MetaCapiCustomData;
};

export type MetaCapiResult = {
  ok: boolean;
  error?: string;
};

export async function sendMetaCapiEvent(
  payload: MetaCapiEventPayload,
  userData: MetaCapiUserData = {},
): Promise<MetaCapiResult> {
  const accessToken = process.env.META_CAPI_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;
  const graphVersion = process.env.META_GRAPH_VERSION?.trim() || "v27.0";
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim();

  if (!accessToken || !pixelId) {
    return { ok: false, error: "Meta CAPI credentials missing" };
  }

  const userDataPayload: Record<string, unknown> = {
    client_user_agent: userData.clientUserAgent,
    ...(userData.clientIpAddress ? { client_ip_address: userData.clientIpAddress } : {}),
    ...(userData.em && userData.em.length > 0 ? { em: userData.em } : {}),
    ...(userData.ph && userData.ph.length > 0 ? { ph: userData.ph } : {}),
    ...(userData.fbp ? { fbp: userData.fbp } : {}),
    ...(userData.fbc ? { fbc: userData.fbc } : {}),
  };

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: payload.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        action_source: "website",
        event_source_url: payload.eventSourceUrl,
        user_data: userDataPayload,
        ...(payload.customData ? { custom_data: payload.customData } : {}),
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      const message = await response.text();
      console.error("Meta CAPI request failed:", response.status, message);
      return { ok: false, error: `HTTP ${response.status}: ${message}` };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Meta CAPI request encountered an error:", message);
    return { ok: false, error: message };
  }
}

export async function sendMetaPurchaseEvent(
  order: Pick<
    OrderDocument,
    | "order_number"
    | "email"
    | "normalized_email"
    | "phone_number"
    | "normalized_phone"
    | "financials"
    | "lines"
    | "meta_attribution"
  >,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL,
): Promise<MetaCapiResult> {
  const emailHash = hashMetaEmail(order.normalized_email || order.email);
  const phoneHash = hashMetaPhone(order.normalized_phone || order.phone_number);

  const customData: MetaCapiCustomData = {
    value: order.financials.merchandise_total,
    currency: "BDT",
    content_type: "product",
    contents: order.lines.map((line) => ({
      id: line.product_id,
      quantity: line.quantity,
      item_price: line.unit_price,
    })),
    num_items: order.lines.reduce((sum, line) => sum + line.quantity, 0),
    order_id: order.order_number,
  };

  const userData: MetaCapiUserData = {
    clientUserAgent: order.meta_attribution?.client_user_agent,
    clientIpAddress: order.meta_attribution?.client_ip,
    fbp: order.meta_attribution?.fbp,
    fbc: order.meta_attribution?.fbc,
    em: emailHash ? [emailHash] : undefined,
    ph: phoneHash ? [phoneHash] : undefined,
  };

  return sendMetaCapiEvent(
    {
      eventName: "Purchase",
      eventId: order.order_number,
      eventSourceUrl: siteUrl ? `${siteUrl.replace(/\/+$/, "")}/payment/result` : undefined,
      customData,
    },
    userData,
  );
}
