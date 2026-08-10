import { afterEach, describe, expect, it } from "vitest";

import {
  getDeliveryFeeForShippingZone,
  getShippingConfig,
  shippingAreaLabel,
} from "./shipping.js";

const originalInside = process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT;
const originalOutside = process.env.DELIVERY_FEE_OUTSIDE_SYLHET_BDT;

function restore(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

afterEach(() => {
  restore("DELIVERY_FEE_INSIDE_SYLHET_BDT", originalInside);
  restore("DELIVERY_FEE_OUTSIDE_SYLHET_BDT", originalOutside);
});

describe("shipping configuration", () => {
  it("returns the two server-authoritative options in display order", () => {
    process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT = "60";
    process.env.DELIVERY_FEE_OUTSIDE_SYLHET_BDT = "120";

    expect(getShippingConfig()).toEqual({
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
    });
    expect(getDeliveryFeeForShippingZone("inside_sylhet")).toBe(60);
    expect(getDeliveryFeeForShippingZone("outside_sylhet")).toBe(120);
  });

  it("rejects missing, non-integer, and non-positive fees", () => {
    delete process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT;
    process.env.DELIVERY_FEE_OUTSIDE_SYLHET_BDT = "120";
    expect(() => getShippingConfig()).toThrow(/INSIDE_SYLHET/);

    process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT = "60.5";
    expect(() => getShippingConfig()).toThrow(/positive whole number/);

    process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT = "60";
    process.env.DELIVERY_FEE_OUTSIDE_SYLHET_BDT = "0";
    expect(() => getShippingConfig()).toThrow(/positive whole number/);
  });

  it("labels historical Orders without inferring an area from their fee", () => {
    expect(shippingAreaLabel()).toBe("Legacy / unspecified");
  });
});
