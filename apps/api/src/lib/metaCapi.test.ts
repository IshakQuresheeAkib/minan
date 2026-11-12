import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderDocument } from "../models/Order.js";
import {
  hashMetaEmail,
  hashMetaPhone,
  normalizeMetaPhone,
  sendMetaCapiEvent,
  sendMetaPurchaseEvent,
  sha256,
} from "./metaCapi.js";

type CapturedCapiBody = {
  data: Array<{
    event_name: string;
    event_id: string;
    custom_data: {
      value: number;
      currency: string;
      num_items?: number;
      contents?: Array<{ id: string; quantity: number; item_price?: number }>;
    };
    user_data: {
      client_user_agent?: string;
      client_ip_address?: string;
      fbp?: string;
      fbc?: string;
      em?: string[];
      ph?: string[];
    };
  }>;
  test_event_code?: string;
};

describe("metaCapi helpers", () => {
  it("normalizes and hashes emails with SHA-256", () => {
    const raw = "  User@Example.COM ";
    const expected = sha256("user@example.com");
    expect(hashMetaEmail(raw)).toBe(expected);
    expect(hashMetaEmail("")).toBeUndefined();
    expect(hashMetaEmail(undefined)).toBeUndefined();
  });

  it("normalizes Bangladesh phone numbers to E.164 (without plus) for Meta", () => {
    expect(normalizeMetaPhone("01700000000")).toBe("8801700000000");
    expect(normalizeMetaPhone("+880 1700-000000")).toBe("8801700000000");
    expect(normalizeMetaPhone("8801700000000")).toBe("8801700000000");
    expect(normalizeMetaPhone("1700000000")).toBe("8801700000000");
    expect(normalizeMetaPhone("")).toBeUndefined();
  });

  it("hashes normalized phone numbers", () => {
    const expected = sha256("8801700000000");
    expect(hashMetaPhone("01700000000")).toBe(expected);
    expect(hashMetaPhone("+880 1700 000 000")).toBe(expected);
  });
});

describe("sendMetaCapiEvent", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("returns error if META_CAPI_TOKEN or META_PIXEL_ID is missing", async () => {
    delete process.env.META_CAPI_TOKEN;
    delete process.env.META_PIXEL_ID;

    const result = await sendMetaCapiEvent({
      eventName: "Purchase",
      eventId: "ord_1",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("missing");
  });

  it("formats CAPI payload correctly and handles successful HTTP 200", async () => {
    process.env.META_CAPI_TOKEN = "test_token";
    process.env.META_PIXEL_ID = "123456789";
    process.env.META_GRAPH_VERSION = "v27.0";
    process.env.META_TEST_EVENT_CODE = "TEST1234";

    let capturedUrl = "";
    let capturedBody: CapturedCapiBody | undefined;

    global.fetch = vi.fn().mockImplementation(async (url, init) => {
      capturedUrl = String(url);
      capturedBody = JSON.parse(init.body as string) as CapturedCapiBody;
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
    });

    const result = await sendMetaCapiEvent(
      {
        eventName: "Purchase",
        eventId: "ord_1001",
        eventSourceUrl: "https://minanclothing.com/payment/result",
        customData: {
          value: 2500,
          currency: "BDT",
        },
      },
      {
        clientUserAgent: "Mozilla/5.0",
        clientIpAddress: "103.100.10.5",
        fbp: "fb.1.123",
        fbc: "fb.1.456",
        em: ["hashed_email"],
        ph: ["hashed_phone"],
      },
    );

    expect(result.ok).toBe(true);
    expect(capturedUrl).toContain("https://graph.facebook.com/v27.0/123456789/events");
    expect(capturedUrl).toContain("access_token=test_token");
    expect(capturedBody?.test_event_code).toBe("TEST1234");
    expect(capturedBody?.data[0].event_name).toBe("Purchase");
    expect(capturedBody?.data[0].event_id).toBe("ord_1001");
    expect(capturedBody?.data[0].custom_data.value).toBe(2500);
    expect(capturedBody?.data[0].custom_data.currency).toBe("BDT");
    expect(capturedBody?.data[0].user_data.client_user_agent).toBe("Mozilla/5.0");
    expect(capturedBody?.data[0].user_data.client_ip_address).toBe("103.100.10.5");
    expect(capturedBody?.data[0].user_data.fbp).toBe("fb.1.123");
    expect(capturedBody?.data[0].user_data.fbc).toBe("fb.1.456");
    expect(capturedBody?.data[0].user_data.em).toEqual(["hashed_email"]);
    expect(capturedBody?.data[0].user_data.ph).toEqual(["hashed_phone"]);
  });

  it("returns error message when Meta API responds with non-200", async () => {
    process.env.META_CAPI_TOKEN = "test_token";
    process.env.META_PIXEL_ID = "123456789";

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Invalid OAuth access token" } }), { status: 400 }),
    );

    const result = await sendMetaCapiEvent({
      eventName: "Purchase",
      eventId: "ord_1",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("HTTP 400");
  });
});

describe("sendMetaPurchaseEvent", () => {
  beforeEach(() => {
    process.env.META_CAPI_TOKEN = "test_token";
    process.env.META_PIXEL_ID = "123456789";
    process.env.NEXT_PUBLIC_SITE_URL = "https://minanclothing.com";
    vi.restoreAllMocks();
  });

  it("constructs full purchase payload from order details", async () => {
    let capturedBody: CapturedCapiBody | undefined;
    global.fetch = vi.fn().mockImplementation(async (_, init) => {
      capturedBody = JSON.parse(init.body as string) as CapturedCapiBody;
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
    });

    const mockOrder = {
      order_number: "MINAN-2026-0001",
      email: "buyer@example.com",
      normalized_email: "buyer@example.com",
      phone_number: "01712345678",
      normalized_phone: "01712345678",
      financials: {
        merchandise_total: 4200,
      },
      lines: [
        { product_id: "prod_1", quantity: 2, unit_price: 1500 },
        { product_id: "prod_2", quantity: 1, unit_price: 1200 },
      ],
      meta_attribution: {
        client_ip: "103.20.10.1",
        client_user_agent: "TestAgent",
        fbp: "fb.1.999",
        fbc: "fb.1.888",
      },
    };

    const result = await sendMetaPurchaseEvent(mockOrder as unknown as OrderDocument);

    expect(result.ok).toBe(true);
    const event = capturedBody?.data[0];
    expect(event?.event_name).toBe("Purchase");
    expect(event?.event_id).toBe("MINAN-2026-0001");
    expect(event?.custom_data.value).toBe(4200);
    expect(event?.custom_data.currency).toBe("BDT");
    expect(event?.custom_data.num_items).toBe(3);
    expect(event?.custom_data.contents).toHaveLength(2);
    expect(event?.user_data.em).toEqual([sha256("buyer@example.com")]);
    expect(event?.user_data.ph).toEqual([sha256("8801712345678")]);
    expect(event?.user_data.client_ip_address).toBe("103.20.10.1");
    expect(event?.user_data.fbp).toBe("fb.1.999");
  });
});
