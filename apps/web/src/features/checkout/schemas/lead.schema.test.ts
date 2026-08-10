import { describe, expect, it } from "vitest";

import { leadInputSchema } from "./lead.schema";

const validInput = {
  name: "MINAN Customer",
  phone_number: "01700000000",
  email: "customer@example.com",
  address: "Sylhet, Bangladesh",
  shipping_zone: "inside_sylhet",
};

describe("checkout form validation", () => {
  it("requires a known shipping method", () => {
    const missingZone = Object.fromEntries(
      Object.entries(validInput).filter(([key]) => key !== "shipping_zone"),
    );
    expect(leadInputSchema.safeParse(missingZone).success).toBe(false);
    expect(leadInputSchema.safeParse({
      ...validInput,
      shipping_zone: "near_sylhet",
    }).success).toBe(false);
    expect(leadInputSchema.safeParse(validInput).success).toBe(true);
  });
});
