import { Types } from "mongoose";

import {
  destroyManagedImage,
  getManagedPublicIdFromUrl,
} from "../lib/cloudinary.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";

type CleanupRemovedImagesOptions = {
  previousUrls: string[];
  nextUrls: string[];
  productId?: string;
  categoryId?: string;
};

type ProductImageReferenceFilter = {
  images: string;
  _id?: { $ne: Types.ObjectId };
};

type CategoryImageReferenceFilter = {
  image_url: string;
  _id?: { $ne: Types.ObjectId };
};

function getRemovedUrls(previousUrls: string[], nextUrls: string[]): string[] {
  const nextUrlSet = new Set(nextUrls);
  return Array.from(new Set(previousUrls.filter((url) => !nextUrlSet.has(url))));
}

async function isImageReferencedElsewhere(
  url: string,
  options: Pick<CleanupRemovedImagesOptions, "productId" | "categoryId">,
): Promise<boolean> {
  const productFilter: ProductImageReferenceFilter = { images: url };
  const categoryFilter: CategoryImageReferenceFilter = { image_url: url };

  if (options.productId && Types.ObjectId.isValid(options.productId)) {
    productFilter._id = { $ne: new Types.ObjectId(options.productId) };
  }

  if (options.categoryId && Types.ObjectId.isValid(options.categoryId)) {
    categoryFilter._id = { $ne: new Types.ObjectId(options.categoryId) };
  }

  const [productReferences, categoryReferences] = await Promise.all([
    Product.countDocuments(productFilter),
    Category.countDocuments(categoryFilter),
  ]);

  return productReferences + categoryReferences > 0;
}

export async function cleanupRemovedManagedImages(
  options: CleanupRemovedImagesOptions,
): Promise<void> {
  const removedUrls = getRemovedUrls(options.previousUrls, options.nextUrls);

  for (const url of removedUrls) {
    try {
      const publicId = getManagedPublicIdFromUrl(url);

      if (!publicId) {
        continue;
      }

      const stillReferenced = await isImageReferencedElsewhere(url, options);

      if (!stillReferenced) {
        await destroyManagedImage(publicId);
      }
    } catch (error) {
      console.error("Failed to clean up removed Cloudinary image", {
        url,
        error,
      });
    }
  }
}
