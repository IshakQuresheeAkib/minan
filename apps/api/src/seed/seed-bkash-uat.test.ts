import { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const originalNodeEnv = process.env.NODE_ENV;
const originalAllowProdSeed = process.env.ALLOW_PROD_UAT_SEED;
const originalUatPassword = process.env.BKASH_UAT_TEST_PASSWORD;

describe("seedBkashUat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    delete process.env.ALLOW_PROD_UAT_SEED;
    delete process.env.BKASH_UAT_TEST_PASSWORD;
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalAllowProdSeed === undefined) delete process.env.ALLOW_PROD_UAT_SEED;
    else process.env.ALLOW_PROD_UAT_SEED = originalAllowProdSeed;
    if (originalUatPassword === undefined) delete process.env.BKASH_UAT_TEST_PASSWORD;
    else process.env.BKASH_UAT_TEST_PASSWORD = originalUatPassword;
  });

  it("seeds 3 test products (2 with matching price for duplicate test, 1 high value for insufficient balance) and test user", async () => {
    const fakeCategoryId = new Types.ObjectId();
    mocks.categoryFindOne.mockResolvedValue({ _id: fakeCategoryId, slug: "bkash-uat" });

    const result = await seedBkashUat();

    expect(mocks.connectDB).toHaveBeenCalled();
    expect(mocks.categoryFindOne).toHaveBeenCalledWith({ slug: "bkash-uat" });
    expect(result.products).toHaveLength(3);

    const [item1, item2, item3] = result.products;
    expect(item1?.price).toBe(10);
    expect(item2?.price).toBe(10);
    expect(item1?.price).toBe(item2?.price); // Duplicate test requires same amount
    expect(item3?.price).toBe(150000); // Insufficient balance test

    expect(mocks.productFindOneAndUpdate).toHaveBeenCalledTimes(3);
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

    expect(result.user.email).toBe("bkash-uat@minan.com");
    expect(result.user.password).toBe("MinanBkashUAT2026!");
  });

  it("refuses production seeding unless explicitly enabled with a unique password", async () => {
    process.env.NODE_ENV = "production";

    await expect(seedBkashUat()).rejects.toThrow("ALLOW_PROD_UAT_SEED=true");
    expect(mocks.connectDB).not.toHaveBeenCalled();

    process.env.ALLOW_PROD_UAT_SEED = "true";
    await expect(seedBkashUat()).rejects.toThrow("BKASH_UAT_TEST_PASSWORD");
    expect(mocks.connectDB).not.toHaveBeenCalled();
  });
});
