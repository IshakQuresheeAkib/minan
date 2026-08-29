import { Types } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import { Product } from "../models/Product.js";
import { buildVerifiedCartSnapshot } from "./checkoutCart.service.js";

describe("checkout cart tracking snapshot", () => {
  it("freezes the primary product image with the verified item", async () => {
    const productId = new Types.ObjectId();
    const select = vi.fn().mockResolvedValue([{
      _id: productId,
      name: "Oxford Shirt",
      price: 1500,
      discount: 20,
      sizes: ["M"],
      colors: ["Black"],
      images: ["https://res.cloudinary.com/minan/image/upload/shirt.webp"],
    }]);
    vi.spyOn(Product, "find").mockReturnValue({ select } as never);

    const snapshot = await buildVerifiedCartSnapshot({
      items: [{
        product_id: productId.toString(),
        name: "Ignored client name",
        price: 1,
        size: "M",
        color: "Black",
        quantity: 1,
      }],
      total: 1,
    });

    expect(select).toHaveBeenCalledWith("_id name price discount sizes colors images");
    expect(snapshot.items[0]).toMatchObject({
      image_url: "https://res.cloudinary.com/minan/image/upload/shirt.webp",
    });
  });
});
