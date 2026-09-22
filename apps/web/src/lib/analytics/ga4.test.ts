import { describe, expect, it } from "vitest";

import { getGa4MeasurementId } from "./ga4";

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
