import { describe, expect, it } from "vitest";

import { paymentCreateSchema } from "./bkash.schemas.js";

const validCheckout = {
  name: "MINAN Customer",
  phone_number: "01700000000",
  email: "customer@example.com",
  address: "Sylhet, Bangladesh",
  checkout_source: "cart",
  shipping_zone: "inside_sylhet",
  cart_snapshot: {
    items: [{
      product_id: "507f1f77bcf86cd799439011",
      name: "Oxford Shirt",
      price: 1200,
      size: "M",
      color: "Black",
      quantity: 1,
    }],
    total: 1200,
  },
};

describe("checkout payment validation", () => {
  it("accepts both methods and defaults an older storefront request to COD", () => {
    expect(paymentCreateSchema.parse(validCheckout).payment_method).toBe("cod");
    expect(paymentCreateSchema.parse(validCheckout).checkout_identity_mode).toBe("guest");
    expect(paymentCreateSchema.parse({
      ...validCheckout,
      payment_method: "bkash_full",
    }).payment_method).toBe("bkash_full");
    expect(paymentCreateSchema.safeParse({
      ...validCheckout,
      payment_method: "card",
    }).success).toBe(false);
  });

  it("accepts only explicit customer or guest checkout ownership modes", () => {
    expect(paymentCreateSchema.parse({
      ...validCheckout,
      checkout_identity_mode: "customer",
    }).checkout_identity_mode).toBe("customer");
    expect(paymentCreateSchema.safeParse({
      ...validCheckout,
      checkout_identity_mode: "admin",
    }).success).toBe(false);
  });

  it("accepts legacy zone-less requests but rejects unknown zones", () => {
    const missingZone = Object.fromEntries(
      Object.entries(validCheckout).filter(([key]) => key !== "shipping_zone"),
    );

    expect(paymentCreateSchema.safeParse(missingZone).success).toBe(true);
    expect(paymentCreateSchema.safeParse({
      ...validCheckout,
      shipping_zone: "near_sylhet",
    }).success).toBe(false);
    expect(paymentCreateSchema.safeParse(validCheckout).success).toBe(true);
  });

  it("does not accept a client fee as the zone selection", () => {
    const withoutZone = Object.fromEntries(
      Object.entries(validCheckout).filter(([key]) => key !== "shipping_zone"),
    );
    const parsedLegacy = paymentCreateSchema.parse({
      ...withoutZone,
      delivery_fee: 1,
    });
    expect(parsedLegacy).not.toHaveProperty("delivery_fee");

    const parsed = paymentCreateSchema.parse({
      ...validCheckout,
      delivery_fee: 1,
    });
    expect(parsed).not.toHaveProperty("delivery_fee");
  });
});
