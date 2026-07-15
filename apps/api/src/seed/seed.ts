import "dotenv/config";

import type { Types } from "mongoose";

import { connectDB, disconnectDB } from "../config/db.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Subcategory } from "../models/Subcategory.js";
import { categorySeeds } from "./data/categories.js";
import { productSeeds } from "./data/products.js";
import { subcategorySeeds } from "./data/subcategories.js";

type ProductSeedSet = {
  name: string;
  slug: string;
  description: string;
  price: number;
  category_id: Types.ObjectId;
  subcategory_id?: Types.ObjectId;
  sizes: string[];
  colors: string[];
  images: string[];
  is_active: boolean;
};

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

  for (const subcategory of subcategorySeeds) {
    const categoryId = categoryBySlug.get(subcategory.categorySlug);
    if (!categoryId) {
      throw new Error(
        `Missing category for subcategory slug "${subcategory.slug}"`,
      );
    }

    await Subcategory.findOneAndUpdate(
      { slug: subcategory.slug },
      {
        $set: {
          category_id: categoryId,
          name: subcategory.name,
          slug: subcategory.slug,
          display_order: subcategory.displayOrder,
          is_active: true,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  const subcategories = await Subcategory.find({
    slug: { $in: subcategorySeeds.map((subcategory) => subcategory.slug) },
  });
  const subcategoryBySlug = new Map(
    subcategories.map((subcategory) => [subcategory.slug, subcategory._id]),
  );

  for (const product of productSeeds) {
    const categoryId = categoryBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for product slug "${product.slug}"`);
    }

    const productSet: ProductSeedSet = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category_id: categoryId,
      sizes: product.sizes,
      colors: product.colors,
      images: product.images,
      is_active: true,
    };

    if (product.subcategorySlug) {
      const subcategoryId = subcategoryBySlug.get(product.subcategorySlug);
      if (!subcategoryId) {
        throw new Error(
          `Missing subcategory for product slug "${product.slug}"`,
        );
      }
      productSet.subcategory_id = subcategoryId;
    }

    await Product.findOneAndUpdate(
      { slug: product.slug },
      {
        $set: productSet,
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  const categoryCount = await Category.countDocuments({ is_active: true });
  const subcategoryCount = await Subcategory.countDocuments({
    is_active: true,
  });
  const productCount = await Product.countDocuments({ is_active: true });
  const categoriesUsingSubcategories = await Subcategory.distinct(
    "category_id",
    { is_active: true },
  );
  const missingSubcategoryCount = await Product.countDocuments({
    is_active: true,
    category_id: { $in: categoriesUsingSubcategories },
    subcategory_id: null,
  });

  await revalidateStorefront();

  console.log(
    `Seed complete: ${categoryCount} categories, ${subcategoryCount} subcategories, ${productCount} products`,
  );
  console.log(
    `Active products needing subcategory assignment: ${missingSubcategoryCount}`,
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
