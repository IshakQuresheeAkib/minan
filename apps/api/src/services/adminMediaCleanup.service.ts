import {
  destroyManagedImage,
  getManagedPublicIdFromUrl,
} from "../lib/cloudinary.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";

type CleanupRemovedImagesOptions = {
  previousUrls: string[];
  nextUrls: string[];
};

function collectReferencedManagedPublicIds(
  urls: readonly string[],
  candidatePublicIds: ReadonlySet<string>,
  referencedPublicIds: Set<string>,
): void {
  for (const url of urls) {
    const publicId = getManagedPublicIdFromUrl(url);

    if (publicId && candidatePublicIds.has(publicId)) {
      referencedPublicIds.add(publicId);
    }
  }
}

export function findReferencedManagedPublicIdsInUrls(
  publicIds: readonly string[],
  urls: readonly string[],
): Set<string> {
  const candidatePublicIds = new Set(publicIds);
  const referencedPublicIds = new Set<string>();
  collectReferencedManagedPublicIds(
    urls,
    candidatePublicIds,
    referencedPublicIds,
  );
  return referencedPublicIds;
}

export async function findReferencedManagedPublicIds(
  publicIds: readonly string[],
): Promise<Set<string>> {
  const candidatePublicIds = new Set(publicIds);

  if (candidatePublicIds.size === 0) {
    return new Set();
  }

  const [products, categories] = await Promise.all([
    Product.find().select({ _id: 0, images: 1 }).lean(),
    Category.find().select({ _id: 0, image_url: 1 }).lean(),
  ]);
  const referencedPublicIds = new Set<string>();

  for (const product of products) {
    collectReferencedManagedPublicIds(
      product.images,
      candidatePublicIds,
      referencedPublicIds,
    );
  }

  collectReferencedManagedPublicIds(
    categories.map((category) => category.image_url),
    candidatePublicIds,
    referencedPublicIds,
  );

  return referencedPublicIds;
}

function getManagedPublicIds(urls: readonly string[]): Set<string> {
  const publicIds = new Set<string>();

  for (const url of urls) {
    const publicId = getManagedPublicIdFromUrl(url);

    if (publicId) {
      publicIds.add(publicId);
    }
  }

  return publicIds;
}

export function findRemovedManagedPublicIds(
  previousUrls: readonly string[],
  nextUrls: readonly string[],
): string[] {
  const previousPublicIds = getManagedPublicIds(previousUrls);
  const nextPublicIds = getManagedPublicIds(nextUrls);
  return Array.from(previousPublicIds).filter(
    (publicId) => !nextPublicIds.has(publicId),
  );
}

export async function cleanupRemovedManagedImages(
  options: CleanupRemovedImagesOptions,
): Promise<void> {
  const removedPublicIds = findRemovedManagedPublicIds(
    options.previousUrls,
    options.nextUrls,
  );

  if (removedPublicIds.length === 0) {
    return;
  }

  let referencedPublicIds: Set<string>;

  try {
    referencedPublicIds = await findReferencedManagedPublicIds(
      removedPublicIds,
    );
  } catch (error) {
    console.error("Failed to check Cloudinary image references", {
      publicIds: removedPublicIds,
      error,
    });
    return;
  }

  for (const publicId of removedPublicIds) {
    if (referencedPublicIds.has(publicId)) {
      continue;
    }

    try {
      await destroyManagedImage(publicId);
    } catch (error) {
      console.error("Failed to clean up removed Cloudinary image", {
        publicId,
        error,
      });
    }
  }
}
