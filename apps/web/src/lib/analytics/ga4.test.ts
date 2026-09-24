import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";
import { enableGa4ForCompletedPaymentResult } from "./routes";
import { getGa4MeasurementId, markGa4Ready, toGa4Item, trackGa4CommerceEvent, trackGa4Purchase } from "./ga4";

describe("getGa4MeasurementId", () => {
  it("accepts and trims a configured GA4 measurement ID", () => {
    expect(getGa4MeasurementId("  G-ABC123XYZ9  ")).toBe("G-ABC123XYZ9");
  });

  it.each(["", "G-", "UA-12345-1", "G-invalid id"])(
    "rejects an invalid GA4 measurement ID: %s",
    (measurementId) => {
      expect(getGa4MeasurementId(measurementId)).toBeNull();
    },
  );
});

describe("GA4 ecommerce events", () => {
  const originalId = env.ga4Id;

  afterEach(() => {
    Object.assign(env, { ga4Id: originalId });
    vi.unstubAllGlobals();
  });

  it("queues only product data and the added quantity", () => {
    Object.assign(env, { ga4Id: "G-TEST123" });
    const dataLayer: unknown[] = [];
    vi.stubGlobal("window", {
      location: { pathname: "/cart", origin: "https://minan.example" },
      dataLayer,
      gtag: (...args: unknown[]) => dataLayer.push(args),
    });
    vi.stubGlobal("document", { referrer: "https://minan.example/products?reference=secret" });
    const item = toGa4Item({ productId: "sku-1", name: "Linen Shirt", price: 800, quantity: 1, size: "M", color: "Black" });

    expect(trackGa4CommerceEvent("add_to_cart", [item])).toBe(true);
    expect(dataLayer).toEqual([]);
    markGa4Ready();
    expect(dataLayer).toEqual([["event", "add_to_cart", {
      send_to: "G-TEST123", currency: "BDT", value: 800,
      page_location: "https://minan.example/cart",
      page_referrer: "https://minan.example/products",
      items: [{ item_id: "sku-1", item_name: "Linen Shirt", price: 800, quantity: 1, item_variant: "M / Black" }],
    }]]);
  });

  it("queues a purchase on the result route without its reference", () => {
    Object.assign(env, { ga4Id: "G-TEST123" });
    const dataLayer: unknown[] = [];
    vi.stubGlobal("window", {
      location: { pathname: "/payment/result", origin: "https://minan.example", search: "?reference=private" },
      dataLayer,
      gtag: (...args: unknown[]) => dataLayer.push(args),
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal("document", { referrer: "" });
    const scope = window as Window & { location: { search: string } };
    expect(trackGa4Purchase({
      transaction_id: "MN-42", value: 1200, shipping: 60,
      items: [{ item_id: "sku-1", item_name: "Linen Shirt", price: 1200, quantity: 1 }],
    })).toBe(false);
    scope.location.search = "";
    enableGa4ForCompletedPaymentResult();
    expect(trackGa4Purchase({
      transaction_id: "MN-42", value: 1200, shipping: 60,
      items: [{ item_id: "sku-1", item_name: "Linen Shirt", price: 1200, quantity: 1 }],
    })).toBe(true);
    markGa4Ready();
    expect(JSON.stringify(dataLayer)).not.toContain("reference");
    expect(dataLayer).toMatchObject([["event", "purchase", { transaction_id: "MN-42", value: 1200, shipping: 60 }]]);
    expect(trackGa4CommerceEvent("view_item", [{ item_id: "sku-1", item_name: "Linen Shirt", price: 1200, quantity: 1 }])).toBe(true);
    expect(dataLayer).toHaveLength(2);
  });

  it("does not queue events on private routes or while GA4 is disabled", () => {
    Object.assign(env, { ga4Id: "G-TEST123" });
    const windowMock = {
      location: { pathname: "/account/orders", origin: "https://minan.example" },
      dataLayer: [] as unknown[],
      "ga-disable-G-TEST123": false,
    };
    vi.stubGlobal("window", windowMock);
    vi.stubGlobal("document", { referrer: "" });
    const item = toGa4Item({ productId: "sku-1", name: "Linen Shirt", price: 800, quantity: 1 });
    expect(trackGa4CommerceEvent("view_item", [item])).toBe(false);
    windowMock.location.pathname = "/products/linen-shirt";
    windowMock["ga-disable-G-TEST123"] = true;
    expect(trackGa4CommerceEvent("view_item", [item])).toBe(false);
    expect(windowMock.dataLayer).toEqual([]);
  });
});
