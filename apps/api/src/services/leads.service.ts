import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { Lead, type CartSnapshot } from "../models/Lead.js";
import { Product } from "../models/Product.js";
import type { LeadCreateInput } from "../schemas/lead.schemas.js";
import type { LeadResponse } from "../types/admin.types.js";
import { calculateDiscountedPrice } from "../utils/calculateDiscountedPrice.js";
import { serializeLead } from "../utils/serializeLead.js";

const CART_OPTION_FALLBACK = "N/A";

function isValidCartOption(value: string, options: string[]): boolean {
  if (options.length === 0) {
    return value === CART_OPTION_FALLBACK;
  }

  return options.includes(value);
}

async function buildVerifiedCartSnapshot(
  clientSnapshot: LeadCreateInput["cart_snapshot"],
): Promise<CartSnapshot> {
  const uniqueProductIds = [
    ...new Set(clientSnapshot.items.map((item) => item.product_id)),
  ];

  for (const productId of uniqueProductIds) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new AppError("Invalid product in cart", 400);
    }
  }

  const products = await Product.find({
    _id: {
      $in: uniqueProductIds.map((productId) => new Types.ObjectId(productId)),
    },
    is_active: true,
  }).select("_id name price discount sizes colors");

  const productById = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  const items = clientSnapshot.items.map((item) => {
    const product = productById.get(item.product_id);

    if (!product) {
      throw new AppError("Product unavailable or not found", 400);
    }

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
      price: calculateDiscountedPrice(product.price, discount),
      original_price: product.price,
      discount,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    };
  });

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return { items, total };
}

export async function createLead(
  input: LeadCreateInput,
): Promise<LeadResponse> {
  const cart_snapshot = await buildVerifiedCartSnapshot(input.cart_snapshot);

  const lead = await Lead.create({
    ...input,
    cart_snapshot,
  });

  return serializeLead(lead);
}
