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

export type MediaCleanupResult = {
  removed: number;
  retained: number;
  failed: number;
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
): Promise<MediaCleanupResult> {
  let removedPublicIds: string[];

  try {
    removedPublicIds = findRemovedManagedPublicIds(
      options.previousUrls,
      options.nextUrls,
    );
  } catch (error) {
    const failed = new Set(options.previousUrls).size;
    console.error("Failed to resolve managed Cloudinary images", {
      urls: options.previousUrls,
      error,
    });
    return { removed: 0, retained: 0, failed };
  }

  if (removedPublicIds.length === 0) {
    return { removed: 0, retained: 0, failed: 0 };
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
    return { removed: 0, retained: 0, failed: removedPublicIds.length };
  }

  const cleanupResult: MediaCleanupResult = {
    removed: 0,
    retained: 0,
    failed: 0,
  };

  for (const publicId of removedPublicIds) {
    if (referencedPublicIds.has(publicId)) {
      cleanupResult.retained += 1;
      continue;
    }

    try {
      const result = await destroyManagedImage(publicId);

      if (
        result.result === "ok" ||
        result.result === "not found" ||
        result.result === "not_found"
      ) {
        cleanupResult.removed += 1;
        continue;
      }

      cleanupResult.failed += 1;
      console.error("Cloudinary returned an unexpected cleanup result", {
        publicId,
        result: result.result,
      });
    } catch (error) {
      cleanupResult.failed += 1;
      console.error("Failed to clean up removed Cloudinary image", {
        publicId,
        error,
      });
    }
  }

  return cleanupResult;
}
