import { describe, expect, it } from "vitest";

import {
  getPaymentSplit,
  paymentResponseMatchesContract,
} from "./paymentContract";

const contract = {
  version: 2 as const,
  methods: ["bkash_full", "cod"] as ["bkash_full", "cod"],
};

describe("checkout payment contract", () => {
  it("calculates the two customer-visible payment splits", () => {
    expect(getPaymentSplit("bkash_full", 1200, 100)).toEqual({
      payNow: 1300,
      dueOnDelivery: 0,
    });
    expect(getPaymentSplit("cod", 1200, 100)).toEqual({
      payNow: 100,
      dueOnDelivery: 1200,
    });
  });

  it("blocks redirects whose advertised method, version, or amount differs", () => {
    const result = {
      state: "redirect" as const,
      bkash_url: "https://sandbox.bka.sh/pay",
      payment_contract_version: 2 as const,
      payment_method: "bkash_full" as const,
      pay_now_amount: 1300,
    };
    expect(paymentResponseMatchesContract(result, contract, "bkash_full", 1300)).toBe(true);
    expect(paymentResponseMatchesContract(result, contract, "cod", 100)).toBe(false);
    expect(paymentResponseMatchesContract({ ...result, pay_now_amount: 100 }, contract, "bkash_full", 1300)).toBe(false);
    expect(paymentResponseMatchesContract(
      { state: "redirect", bkash_url: result.bkash_url },
      undefined,
      "cod",
      100,
    )).toBe(true);
  });
});
