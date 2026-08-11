import { AppError } from "../lib/errors.js";
import {
  getCheckoutPaymentContract,
  type CheckoutPaymentContract,
} from "./checkoutPayment.js";

export const shippingZones = ["inside_sylhet", "outside_sylhet"] as const;

export type ShippingZone = (typeof shippingZones)[number];

export type ShippingOption = {
  id: ShippingZone;
  label: string;
  delivery_fee: number;
};

export type ShippingConfig = {
  delivery_fee: number;
  shipping_options: [ShippingOption, ShippingOption];
  currency: "BDT";
  refundable: false;
  payment_contract: CheckoutPaymentContract;
};

function requiredPositiveInteger(name: string): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    throw new AppError(`Shipping configuration is missing ${name}`, 503);
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new AppError(`${name} must be a positive whole number`, 503);
  }
  return value;
}

export function getShippingConfig(): ShippingConfig {
  return {
    delivery_fee: requiredPositiveInteger("DELIVERY_FEE_BDT"),
    shipping_options: [
      {
        id: "inside_sylhet",
        label: "Inside Sylhet Shipping Cost",
        delivery_fee: requiredPositiveInteger("DELIVERY_FEE_INSIDE_SYLHET_BDT"),
      },
      {
        id: "outside_sylhet",
        label: "Outside Sylhet Shipping Cost",
        delivery_fee: requiredPositiveInteger("DELIVERY_FEE_OUTSIDE_SYLHET_BDT"),
      },
    ],
    currency: "BDT",
    refundable: false,
    payment_contract: getCheckoutPaymentContract(),
  };
}

export function getDeliveryFeeForShippingZone(zone: ShippingZone): number {
  const option = getShippingConfig().shipping_options.find((item) => item.id === zone);
  if (!option) {
    throw new AppError("Shipping method is unavailable", 503);
  }
  return option.delivery_fee;
}

export function getDeliveryFeeForCheckout(zone?: ShippingZone): number {
  if (zone) return getDeliveryFeeForShippingZone(zone);
  return getShippingConfig().delivery_fee;
}

export function shippingAreaLabel(zone?: ShippingZone): string {
  if (zone === "inside_sylhet") return "Inside Sylhet";
  if (zone === "outside_sylhet") return "Outside Sylhet";
  return "Legacy / unspecified";
}
