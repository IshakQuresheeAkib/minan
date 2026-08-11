import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LeadInput } from "@/features/checkout/schemas/lead.schema";
import type { CartSnapshot } from "@/features/checkout/types";
import { getCheckoutIdempotencyKey } from "./checkoutSession";

const cartSnapshot: CartSnapshot = {
  items: [
    {
      product_id: "product-1",
      name: "Oxford Shirt",
      price: 1200,
      size: "M",
      color: "Black",
      quantity: 1,
    },
  ],
  total: 1200,
};

const customer: LeadInput = {
  name: "MINAN Customer",
  phone_number: "01700000000",
  email: "customer@example.com",
  address: "Original delivery address",
  shipping_zone: "inside_sylhet",
  payment_method: "cod",
  notes: "",
};

describe("checkout idempotency session", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    let sequence = 0;
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    });
    vi.stubGlobal("crypto", {
      randomUUID: () => `checkout-key-${++sequence}`,
    });
  });

  it("reuses a key only while the cart and customer details are unchanged", () => {
    const first = getCheckoutIdempotencyKey("cart", cartSnapshot, customer);
    const replay = getCheckoutIdempotencyKey("cart", cartSnapshot, customer);
    const corrected = getCheckoutIdempotencyKey("cart", cartSnapshot, {
      ...customer,
      address: "Corrected delivery address",
    });

    expect(replay).toBe(first);
    expect(corrected).not.toBe(first);
  });

  it("rotates the key when the selected shipping zone changes", () => {
    const inside = getCheckoutIdempotencyKey("cart", cartSnapshot, customer);
    const outside = getCheckoutIdempotencyKey("cart", cartSnapshot, {
      ...customer,
      shipping_zone: "outside_sylhet",
    });

    expect(outside).not.toBe(inside);
  });

  it("reuses the Order key when only the payment method changes", () => {
    const cod = getCheckoutIdempotencyKey("cart", cartSnapshot, customer);
    const full = getCheckoutIdempotencyKey("cart", cartSnapshot, {
      ...customer,
      payment_method: "bkash_full",
    });

    expect(full).toBe(cod);
  });
});
