import { describe, expect, it } from "vitest";

import {
  createSequenceReservation,
  dateKey,
  takeReservedOrderNumber,
} from "./migrate-leads-to-orders.js";

describe("lead to Order migration numbering", () => {
  it("uses Bangladesh dates for migrated Order numbers", () => {
    expect(dateKey(new Date("2026-08-04T20:30:00.000Z"))).toBe("20260805");
  });

  it("continues after a pre-existing live Order sequence", () => {
    const reservation = createSequenceReservation(5, 2);

    expect(takeReservedOrderNumber("20260805", reservation)).toBe("MN-20260805-0004");
    expect(takeReservedOrderNumber("20260805", reservation)).toBe("MN-20260805-0005");
    expect(() => takeReservedOrderNumber("20260805", reservation)).toThrow(
      "Order-number reservation exhausted",
    );
  });
});
