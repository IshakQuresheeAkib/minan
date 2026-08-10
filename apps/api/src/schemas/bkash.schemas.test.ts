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
  it("requires a known shipping zone", () => {
    const missingZone = Object.fromEntries(
      Object.entries(validCheckout).filter(([key]) => key !== "shipping_zone"),
    );

    expect(paymentCreateSchema.safeParse(missingZone).success).toBe(false);
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
    expect(paymentCreateSchema.safeParse({
      ...withoutZone,
      delivery_fee: 1,
    }).success).toBe(false);

    const parsed = paymentCreateSchema.parse({
      ...validCheckout,
      delivery_fee: 1,
    });
    expect(parsed).not.toHaveProperty("delivery_fee");
  });
});
