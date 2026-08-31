import { describe, expect, it } from "vitest";

import {
  Customer,
  hashCustomerPassword,
  verifyCustomerPassword,
} from "./Customer.js";

describe("Customer account domain", () => {
  it("preserves the trimmed account email while deriving the shared normalized form", async () => {
    const customer = new Customer({
      email: "  Customer.Name@Example.COM  ",
      password_hash: "$argon2id$test-only-hash",
    });

    await customer.validate();

    expect(customer.email).toBe("Customer.Name@Example.COM");
    expect(customer.normalized_email).toBe("customer.name@example.com");
  });

  it("declares normalized email uniqueness and hides authentication secrets", async () => {
    const indexes = Customer.schema.indexes();
    const customer = new Customer({
      email: "customer@example.com",
      password_hash: "$argon2id$test-only-hash",
    });

    await customer.validate();
    const serialized = customer.toJSON() as Record<string, unknown>;

    expect(indexes).toContainEqual([
      { normalized_email: 1 },
      { unique: true },
    ]);
    expect(Customer.schema.path("password_hash").options.select).toBe(false);
    expect(serialized).not.toHaveProperty("password_hash");
    expect(serialized).not.toHaveProperty("session_version");
  });

  it("hashes plaintext with Argon2 and verifies only the correct candidate", async () => {
    const hash = await hashCustomerPassword("correct horse battery staple");

    expect(hash).not.toContain("correct horse battery staple");
    await expect(
      verifyCustomerPassword(hash, "correct horse battery staple"),
    ).resolves.toBe(true);
    await expect(
      verifyCustomerPassword(hash, "wrong password"),
    ).resolves.toBe(false);
  });
});
