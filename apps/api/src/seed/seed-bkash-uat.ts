import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { Category } from "../models/Category.js";
import { Customer, hashCustomerPassword } from "../models/Customer.js";
import { Product } from "../models/Product.js";

export async function seedBkashUat(): Promise<{
  user: { email: string; password: string };
  users: { email: string; password: string }[];
  products: { name: string; slug: string; price: number; purpose: string }[];
}> {
  const configuredPassword = process.env.BKASH_UAT_TEST_PASSWORD?.trim();
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_UAT_SEED !== "true") {
    throw new Error("Refusing to seed bKash UAT data in production without ALLOW_PROD_UAT_SEED=true");
  }
  if (
    process.env.NODE_ENV === "production" &&
    (!configuredPassword || configuredPassword === "MinanBkashUAT2026!")
  ) {
    throw new Error("BKASH_UAT_TEST_PASSWORD must be set to a unique value for production UAT");
  }

  await connectDB();

  // 1. Get or create the dedicated UAT category
  let category = await Category.findOne({ slug: "bkash-uat" });
  if (!category) {
    category = await Category.create({
      name: "bKash UAT Test Category",
      slug: "bkash-uat",
      image_url: "https://picsum.photos/seed/bkash-uat-category/600/600",
      is_active: true,
    });
  }

  // 2. Define test products
  const testProducts = [
    {
      name: "bKash UAT Test Item 1",
      slug: "bkash-uat-test-item-1",
      description: "Dedicated test item for bKash PGW UAT verification (10 BDT).",
      price: 10,
      discount: 0,
      category_id: category._id,
      sizes: ["Regular"],
      colors: ["Standard"],
      images: ["https://picsum.photos/seed/bkash-uat-1/600/800"],
      is_active: true,
      purpose: "Successful payment and initial step of duplicate transaction test",
    },
    {
      name: "bKash UAT Test Item 2",
      slug: "bkash-uat-test-item-2",
      description: "Dedicated test item for bKash duplicate payment test within 2 minutes (identical 10 BDT amount).",
      price: 10,
      discount: 0,
      category_id: category._id,
      sizes: ["Regular"],
      colors: ["Standard"],
      images: ["https://picsum.photos/seed/bkash-uat-2/600/800"],
      is_active: true,
      purpose: "Duplicate transaction check (same amount within 2 minutes)",
    },
    {
      name: "bKash UAT High Value Item",
      slug: "bkash-uat-high-value-item",
      description: "High-value test item to test bKash Insufficient Balance error (2023).",
      price: 150000,
      discount: 0,
      category_id: category._id,
      sizes: ["Regular"],
      colors: ["Standard"],
      images: ["https://picsum.photos/seed/bkash-uat-high/600/800"],
      is_active: true,
      purpose: "Insufficient Balance test case (triggers code 2023)",
    },
  ];

  for (const item of testProducts) {
    await Product.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: item.price,
          discount: item.discount,
          category_id: item.category_id,
          sizes: item.sizes,
          colors: item.colors,
          images: item.images,
          is_active: item.is_active,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  // 3. Upsert UAT Test Customers
  const uatEmails = Array.from(
    new Set(
      [
        process.env.BKASH_UAT_TEST_EMAIL,
        "bkash-uat@minan.com",
      ]
        .filter(Boolean)
        .map((e) => (e as string).trim().toLowerCase()),
    ),
  );
  const uatPassword = configuredPassword || "MinanBkashUAT2026!";
  const passwordHash = await hashCustomerPassword(uatPassword);

  for (const email of uatEmails) {
    await Customer.findOneAndUpdate(
      { normalized_email: email },
      {
        $set: {
          email,
          normalized_email: email,
          password_hash: passwordHash,
          is_active: true,
        },
        $setOnInsert: {
          session_version: 0,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  try {
    await revalidateStorefront();
  } catch {
    // Ignore storefront revalidation errors during seeding
  }

  const primaryUser = {
    email: uatEmails[0] ?? "bkash-uat@minan.com",
    password: uatPassword,
  };

  return {
    user: primaryUser,
    users: uatEmails.map((email) => ({ email, password: uatPassword })),
    products: testProducts.map((p) => ({
      name: p.name,
      slug: p.slug,
      price: p.price,
      purpose: p.purpose,
    })),
  };
}

if (process.argv[1] && process.argv[1].includes("seed-bkash-uat")) {
  seedBkashUat()
    .then(async (result) => {
      console.log("=== bKash UAT Seed Successful ===");
      console.log("Test Customer Accounts:");
      for (const u of result.users) {
        console.log(`  Email:    ${u.email}`);
        if (process.env.NODE_ENV !== "production") {
          console.log(`  Password: ${u.password}`);
        }
      }
      if (process.env.NODE_ENV === "production") {
        console.log("  Password: use the configured BKASH_UAT_TEST_PASSWORD (not printed to deployment logs).");
      }
      console.log("\nTest Products:");
      for (const prod of result.products) {
        console.log(`  - ${prod.name} (${prod.price} BDT)`);
        console.log(`    URL: /products/${prod.slug}`);
        console.log(`    Purpose: ${prod.purpose}`);
      }
      console.log("=================================");
      await disconnectDB();
      process.exitCode = 0;
    })
    .catch(async (error: unknown) => {
      console.error("bKash UAT seed failed:", error);
      await disconnectDB();
      process.exitCode = 1;
    });
}
