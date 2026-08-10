import { describe, expect, it } from "vitest";

import { checkoutConfigSchema } from "./checkout-config.schema";

const validConfig = {
  delivery_fee: 100,
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
};

describe("checkout configuration validation", () => {
  it("accepts the complete ordered shipping contract", () => {
    expect(checkoutConfigSchema.parse(validConfig)).toEqual(validConfig);
  });

  it("accepts the previous single-fee API contract", () => {
    const legacyConfig = {
      delivery_fee: 100,
      currency: "BDT",
      refundable: false,
    };

    expect(checkoutConfigSchema.parse(legacyConfig)).toEqual(legacyConfig);
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
