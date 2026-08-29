import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { Product } from "../models/Product.js";
import { calculateDiscountedPrice } from "../utils/calculateDiscountedPrice.js";

export type CheckoutCartInput = {
  items: {
    product_id: string;
    name: string;
    price: number;
    size: string;
    color: string;
    quantity: number;
  }[];
  total: number;
};

export type VerifiedCartSnapshot = {
  items: {
    product_id: string;
    name: string;
    image_url?: string;
    price: number;
    original_price?: number;
    discount?: number;
    size: string;
    color: string;
    quantity: number;
  }[];
  total: number;
};

const CART_OPTION_FALLBACK = "N/A";

function isValidCartOption(value: string, options: string[]): boolean {
  return options.length === 0 ? value === CART_OPTION_FALLBACK : options.includes(value);
}

export async function buildVerifiedCartSnapshot(
  clientSnapshot: CheckoutCartInput,
): Promise<VerifiedCartSnapshot> {
  const uniqueProductIds = [
    ...new Set(clientSnapshot.items.map((item) => item.product_id)),
  ];

  for (const productId of uniqueProductIds) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new AppError("Invalid product in cart", 400);
    }
  }

  const products = await Product.find({
    _id: { $in: uniqueProductIds.map((id) => new Types.ObjectId(id)) },
    is_active: true,
  }).select("_id name price discount sizes colors images");
  const productById = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  const items = clientSnapshot.items.map((item) => {
    const product = productById.get(item.product_id);
    if (!product) throw new AppError("Product unavailable or not found", 400);
    if (!isValidCartOption(item.size, product.sizes)) {
      throw new AppError(`Invalid size for ${product.name}`, 400);
    }
    if (!isValidCartOption(item.color, product.colors)) {
      throw new AppError(`Invalid color for ${product.name}`, 400);
    }

    const discount = product.discount ?? 0;
    return {
      product_id: product._id.toString(),
      name: product.name,
      image_url: product.images[0],
      price: calculateDiscountedPrice(product.price, discount),
      original_price: product.price,
      discount,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    };
  });

  return {
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}
