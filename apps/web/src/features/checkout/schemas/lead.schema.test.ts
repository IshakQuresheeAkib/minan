import { describe, expect, it } from "vitest";

import { getLeadInputSchema, leadInputSchema } from "./lead.schema";

const validInput = {
  name: "MINAN Customer",
  phone_number: "01700000000",
  email: "customer@example.com",
  address: "Sylhet, Bangladesh",
  shipping_zone: "inside_sylhet",
  payment_method: "cod",
};

describe("checkout form validation", () => {
  it("requires a known shipping method only for the zone-aware contract", () => {
    const missingZone = Object.fromEntries(
      Object.entries(validInput).filter(([key]) => key !== "shipping_zone"),
    );
    expect(leadInputSchema.safeParse(missingZone).success).toBe(true);
    expect(getLeadInputSchema(true).safeParse(missingZone).success).toBe(false);
    expect(getLeadInputSchema(false).safeParse(missingZone).success).toBe(true);
    expect(leadInputSchema.safeParse({
      ...validInput,
      shipping_zone: "near_sylhet",
    }).success).toBe(false);
    expect(leadInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("requires payment choice only when the API advertises the versioned contract", () => {
    const missingMethod = Object.fromEntries(
      Object.entries(validInput).filter(([key]) => key !== "payment_method"),
    );

    expect(getLeadInputSchema(true, true).safeParse(missingMethod).success).toBe(false);
    expect(getLeadInputSchema(true, false).safeParse(missingMethod).success).toBe(true);
    expect(getLeadInputSchema(true, true).safeParse(validInput).success).toBe(true);
  });
});
