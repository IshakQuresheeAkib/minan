import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { Category } from "../models/Category.js";
import { Customer, hashCustomerPassword } from "../models/Customer.js";
import { Product } from "../models/Product.js";

export async function seedBkashUat(): Promise<{
  user: { email: string; password: string };
  products: { name: string; slug: string; price: number; purpose: string }[];
}> {
  await connectDB();

  // 1. Get or create Category
  let category = await Category.findOne({ is_active: true });
  if (!category) {
    category = await Category.create({
      name: "UAT Test Category",
      slug: "uat-test-category",
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

  // 3. Upsert UAT Test Customer
  const uatEmail = (process.env.BKASH_UAT_TEST_EMAIL || "bkash-uat@minan.com").trim().toLowerCase();
  const uatPassword = process.env.BKASH_UAT_TEST_PASSWORD || "MinanBkashUAT2026!";
  const passwordHash = await hashCustomerPassword(uatPassword);

  await Customer.findOneAndUpdate(
    { normalized_email: uatEmail },
    {
      $set: {
        email: uatEmail,
        normalized_email: uatEmail,
        password_hash: passwordHash,
        is_active: true,
      },
      $setOnInsert: {
        session_version: 0,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  try {
    await revalidateStorefront();
  } catch {
    // Ignore storefront revalidation errors during seeding
  }

  return {
    user: { email: uatEmail, password: uatPassword },
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
      console.log("Test Customer Account:");
      console.log(`  Email:    ${result.user.email}`);
      console.log(`  Password: ${result.user.password}`);
      console.log("\nTest Products:");
      for (const prod of result.products) {
        console.log(`  - ${prod.name} (${prod.price} BDT)`);
        console.log(`    URL: /products/${prod.slug}`);
        console.log(`    Purpose: ${prod.purpose}`);
      }
      console.log("=================================");
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (error: unknown) => {
      console.error("bKash UAT seed failed:", error);
      await disconnectDB();
      process.exit(1);
    });
}
