import { describe, expect, it } from "vitest";

import { checkoutConfigSchema } from "./checkout-config.schema";

const validConfig = {
  shipping_options: [
    {
      id: "inside_sylhet",
      label: "Inside Sylhet Shipping Cost",
      delivery_fee: 60,
    },
    {
      id: "outside_sylhet",
      label: "Outside Sylhet Shipping Cost",
      delivery_fee: 120,
    },
  ],
  currency: "BDT",
  refundable: false,
  payment_contract: {
    version: 2,
    methods: ["bkash_full", "cod"],
  },
};

describe("checkout configuration validation", () => {
  it("accepts the complete ordered shipping contract", () => {
    expect(checkoutConfigSchema.parse(validConfig)).toEqual(validConfig);
  });

  it("rejects configuration missing shipping options", () => {
    const withoutOptions = {
      currency: "BDT",
      refundable: false,
    };

    expect(checkoutConfigSchema.safeParse(withoutOptions).success).toBe(false);
  });

  it("rejects an unknown payment contract version or method order", () => {
    expect(checkoutConfigSchema.safeParse({
      ...validConfig,
      payment_contract: { version: 3, methods: ["bkash_full", "cod"] },
    }).success).toBe(false);
    expect(checkoutConfigSchema.safeParse({
      ...validConfig,
      payment_contract: { version: 2, methods: ["cod", "bkash_full"] },
    }).success).toBe(false);
  });

  it("rejects incomplete, duplicated, and malformed options", () => {
    expect(checkoutConfigSchema.safeParse({
      ...validConfig,
      shipping_options: validConfig.shipping_options.slice(0, 1),
    }).success).toBe(false);
    expect(checkoutConfigSchema.safeParse({
      ...validConfig,
      shipping_options: [validConfig.shipping_options[0], validConfig.shipping_options[0]],
    }).success).toBe(false);
    expect(checkoutConfigSchema.safeParse({
      ...validConfig,
      shipping_options: [
        { ...validConfig.shipping_options[0], delivery_fee: 60.5 },
        validConfig.shipping_options[1],
      ],
    }).success).toBe(false);
  });
});
