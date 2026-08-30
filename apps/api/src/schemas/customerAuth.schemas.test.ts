import { describe, expect, it } from "vitest";

import {
  customerLoginSchema,
  customerSignupSchema,
} from "./customerAuth.schemas.js";

describe("customer auth input validation", () => {
  it("requires a valid email and a bounded signup password", () => {
    expect(customerSignupSchema.safeParse({
      email: "customer@example.com",
      password: "eight888",
    }).success).toBe(true);
    expect(customerSignupSchema.safeParse({
      email: "not-an-email",
      password: "eight888",
    }).success).toBe(false);
    expect(customerSignupSchema.safeParse({
      email: "customer@example.com",
      password: "short",
    }).success).toBe(false);
    expect(customerSignupSchema.safeParse({
      email: "customer@example.com",
      password: "a".repeat(129),
    }).success).toBe(false);
  });

  it("accepts a non-empty bounded password at login without changing it", () => {
    const parsed = customerLoginSchema.parse({
      email: "  Customer@Example.com  ",
      password: "  intentional spaces  ",
    });

    expect(parsed).toEqual({
      email: "Customer@Example.com",
      password: "  intentional spaces  ",
    });
  });
});
