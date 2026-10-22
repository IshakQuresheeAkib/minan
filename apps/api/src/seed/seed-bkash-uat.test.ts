import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connectDB: vi.fn(),
  disconnectDB: vi.fn(),
  categoryFindOne: vi.fn(),
  categoryCreate: vi.fn(),
  productFindOneAndUpdate: vi.fn(),
  customerFindOneAndUpdate: vi.fn(),
  hashPassword: vi.fn(async () => "hashed-argon2-pw"),
  revalidate: vi.fn(async () => undefined),
}));

vi.mock("../config/db.js", () => ({
  connectDB: mocks.connectDB,
  disconnectDB: mocks.disconnectDB,
}));

vi.mock("../lib/revalidateStorefront.js", () => ({
  revalidateStorefront: mocks.revalidate,
}));

vi.mock("../models/Category.js", () => ({
  Category: {
    findOne: mocks.categoryFindOne,
    create: mocks.categoryCreate,
  },
}));

vi.mock("../models/Product.js", () => ({
  Product: {
    findOneAndUpdate: mocks.productFindOneAndUpdate,
  },
}));

vi.mock("../models/Customer.js", () => ({
  Customer: {
    findOneAndUpdate: mocks.customerFindOneAndUpdate,
  },
  hashCustomerPassword: mocks.hashPassword,
}));

import { seedBkashUat } from "./seed-bkash-uat.js";

describe("seedBkashUat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("seeds 3 test products (2 with matching price for duplicate test, 1 high value for insufficient balance) and test user", async () => {
    const fakeCategoryId = new Types.ObjectId();
    mocks.categoryFindOne.mockResolvedValue({ _id: fakeCategoryId, slug: "women" });

    const result = await seedBkashUat();

    expect(mocks.connectDB).toHaveBeenCalled();
    expect(result.products).toHaveLength(3);

    const [item1, item2, item3] = result.products;
    expect(item1.price).toBe(10);
    expect(item2.price).toBe(10);
    expect(item1.price).toBe(item2.price); // Duplicate test requires same amount
    expect(item3.price).toBe(150000); // Insufficient balance test

    expect(mocks.productFindOneAndUpdate).toHaveBeenCalledTimes(3);
    expect(mocks.customerFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ normalized_email: "akibqureshee11@gmail.com" }),
      expect.objectContaining({
        $set: expect.objectContaining({
          email: "akibqureshee11@gmail.com",
          password_hash: "hashed-argon2-pw",
          is_active: true,
        }),
      }),
      expect.objectContaining({ upsert: true }),
    );

    expect(mocks.customerFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ normalized_email: "bkash-uat@minan.com" }),
      expect.objectContaining({
        $set: expect.objectContaining({
          email: "bkash-uat@minan.com",
          password_hash: "hashed-argon2-pw",
          is_active: true,
        }),
      }),
      expect.objectContaining({ upsert: true }),
    );

    expect(result.user.password).toBe("MinanBkashUAT2026!");
  });
});
