import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { categorySeeds } from "./data/categories.js";
import { productSeeds } from "./data/products.js";

async function seed(): Promise<void> {
  await connectDB();

  // Rename ladies-bags → women in-place so all existing product category_id refs stay valid
  await Category.findOneAndUpdate(
    { slug: "ladies-bags" },
    { $set: { name: "Women", slug: "women" } },
  );

  for (const category of categorySeeds) {
    await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: { ...category, is_active: true } },
      { upsert: true, returnDocument: "after" },
    );
  }

  const categories = await Category.find({
    slug: { $in: categorySeeds.map((c) => c.slug) },
  });
  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category._id]),
  );

  for (const product of productSeeds) {
    const categoryId = categoryBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for product slug "${product.slug}"`);
    }

    await Product.findOneAndUpdate(
      { slug: product.slug },
      {
        $set: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          category_id: categoryId,
          sizes: product.sizes,
          colors: product.colors,
          images: product.images,
          is_featured: product.is_featured,
          is_active: true,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  const categoryCount = await Category.countDocuments({ is_active: true });
  const productCount = await Product.countDocuments({ is_active: true });

  console.log(
    `Seed complete: ${categoryCount} categories, ${productCount} products`,
  );
}

seed()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Seed failed:", error);
    await disconnectDB();
    process.exit(1);
  });
