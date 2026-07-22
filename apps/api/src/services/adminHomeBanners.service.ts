import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { getManagedPublicIdFromUrl } from "../lib/cloudinary.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import {
  HomeBannerSet,
  type HomeBannerSetDocument,
} from "../models/HomeBannerSet.js";
import type {
  HomeBannerCreateInput,
  HomeBannerReorderInput,
  HomeBannerUpdateInput,
} from "../schemas/admin.schemas.js";
import { serializeAdminHomeBannerSet } from "../utils/serializeHomeBannerSet.js";
import { cleanupRemovedManagedImages } from "./adminMediaCleanup.service.js";

const HOME_BANNER_KEY = "homepage";
const MAX_HOME_BANNERS = 5;

function assertManagedBannerImage(url: string): void {
  if (!getManagedPublicIdFromUrl(url)) {
    throw new AppError(
      "Home banner images must use the configured MINAN Cloudinary folder",
      400,
    );
  }
}

async function requireBannerSet(): Promise<HomeBannerSetDocument> {
  const bannerSet = await HomeBannerSet.findOne({ key: HOME_BANNER_KEY });

  if (!bannerSet) {
    throw new AppError(
      "Home banners are not initialized. Run the home banner seed first.",
      503,
    );
  }

  return bannerSet;
}

function assertRevision(
  bannerSet: HomeBannerSetDocument,
  expectedRevision: number,
): void {
  if (bannerSet.revision !== expectedRevision) {
    throw new AppError(
      "Home banners changed in another session. Reload and try again.",
      409,
    );
  }
}

function assertObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid home banner id", 400);
  }

  return new Types.ObjectId(id);
}

async function throwMutationConflict(): Promise<never> {
  await requireBannerSet();
  throw new AppError(
    "Home banners changed in another session. Reload and try again.",
    409,
  );
}

async function synchronizeBannerSet(
  bannerSet: HomeBannerSetDocument,
): Promise<HomeBannerSetDocument> {
  const revision = bannerSet.revision;
  const revalidated = await revalidateStorefront(["home-banners"]);

  if (!revalidated) {
    return bannerSet;
  }

  const pendingCleanupUrls = [...bannerSet.pending_cleanup_urls];
  const cleanupResult = await cleanupRemovedManagedImages({
    previousUrls: pendingCleanupUrls,
    nextUrls: [],
  });
  const cleanupComplete = cleanupResult.failed === 0;
  const synchronized = await HomeBannerSet.findOneAndUpdate(
    { _id: bannerSet._id, revision },
    {
      $set: {
        storefront_sync_pending: false,
        ...(cleanupComplete ? { pending_cleanup_urls: [] } : {}),
      },
    },
    { new: true, runValidators: true },
  );

  return synchronized ?? requireBannerSet();
}

export async function getAdminHomeBannerSet() {
  return serializeAdminHomeBannerSet(await requireBannerSet());
}

export async function createAdminHomeBanner(input: HomeBannerCreateInput) {
  assertManagedBannerImage(input.desktop_image_url);
  assertManagedBannerImage(input.mobile_image_url);
  const current = await requireBannerSet();
  assertRevision(current, input.expected_revision);

  if (current.banners.length >= MAX_HOME_BANNERS) {
    throw new AppError("Cannot add more than 5 home banners", 409);
  }

  const bannerId = new Types.ObjectId();
  const updated = await HomeBannerSet.findOneAndUpdate(
    {
      _id: current._id,
      revision: input.expected_revision,
      "banners.4": { $exists: false },
    },
    {
      $push: {
        banners: {
          _id: bannerId,
          desktop_image_url: input.desktop_image_url,
          mobile_image_url: input.mobile_image_url,
        },
      },
      $inc: { revision: 1 },
      $set: { storefront_sync_pending: true },
    },
    { new: true, runValidators: true },
  );

  if (!updated) {
    return throwMutationConflict();
  }

  return serializeAdminHomeBannerSet(await synchronizeBannerSet(updated));
}

export async function updateAdminHomeBanner(
  id: string,
  input: HomeBannerUpdateInput,
) {
  if (input.desktop_image_url !== undefined) {
    assertManagedBannerImage(input.desktop_image_url);
  }
  if (input.mobile_image_url !== undefined) {
    assertManagedBannerImage(input.mobile_image_url);
  }

  const bannerId = assertObjectId(id);
  const current = await requireBannerSet();
  assertRevision(current, input.expected_revision);
  const banner = current.banners.id(bannerId);

  if (!banner) {
    throw new AppError("Home banner not found", 404);
  }

  const removedUrls = [
    input.desktop_image_url !== undefined &&
    input.desktop_image_url !== banner.desktop_image_url
      ? banner.desktop_image_url
      : null,
    input.mobile_image_url !== undefined &&
    input.mobile_image_url !== banner.mobile_image_url
      ? banner.mobile_image_url
      : null,
  ].filter((url): url is string => url !== null);
  const imageUpdates = {
    ...(input.desktop_image_url !== undefined
      ? { "banners.$[banner].desktop_image_url": input.desktop_image_url }
      : {}),
    ...(input.mobile_image_url !== undefined
      ? { "banners.$[banner].mobile_image_url": input.mobile_image_url }
      : {}),
  };
  const updated = await HomeBannerSet.findOneAndUpdate(
    { _id: current._id, revision: input.expected_revision },
    {
      $set: {
        ...imageUpdates,
        storefront_sync_pending: true,
      },
      $inc: { revision: 1 },
      ...(removedUrls.length > 0
        ? {
            $addToSet: {
              pending_cleanup_urls: { $each: removedUrls },
            },
          }
        : {}),
    },
    {
      arrayFilters: [{ "banner._id": bannerId }],
      new: true,
      runValidators: true,
    },
  );

  if (!updated) {
    return throwMutationConflict();
  }

  return serializeAdminHomeBannerSet(await synchronizeBannerSet(updated));
}

export async function reorderAdminHomeBanners(
  input: HomeBannerReorderInput,
) {
  const current = await requireBannerSet();
  assertRevision(current, input.expected_revision);
  const currentById = new Map(
    current.banners.map((banner) => [banner._id.toString(), banner]),
  );

  if (
    input.ordered_ids.length !== current.banners.length ||
    input.ordered_ids.some((id) => !currentById.has(id))
  ) {
    throw new AppError(
      "ordered_ids must contain every current home banner exactly once",
      400,
    );
  }

  const orderedBanners = input.ordered_ids.map((id) => {
    const banner = currentById.get(id);

    if (!banner) {
      throw new AppError("Home banner order is invalid", 400);
    }

    return {
      _id: banner._id,
      desktop_image_url: banner.desktop_image_url,
      mobile_image_url: banner.mobile_image_url,
    };
  });
  const updated = await HomeBannerSet.findOneAndUpdate(
    { _id: current._id, revision: input.expected_revision },
    {
      $set: {
        banners: orderedBanners,
        storefront_sync_pending: true,
      },
      $inc: { revision: 1 },
    },
    { new: true, runValidators: true },
  );

  if (!updated) {
    return throwMutationConflict();
  }

  return serializeAdminHomeBannerSet(await synchronizeBannerSet(updated));
}

export async function deleteAdminHomeBanner(
  id: string,
  expectedRevision: number,
) {
  const bannerId = assertObjectId(id);
  const current = await requireBannerSet();
  assertRevision(current, expectedRevision);

  if (current.banners.length <= 1) {
    throw new AppError("The final home banner cannot be removed", 409);
  }

  const banner = current.banners.id(bannerId);
  if (!banner) {
    throw new AppError("Home banner not found", 404);
  }

  const updated = await HomeBannerSet.findOneAndUpdate(
    {
      _id: current._id,
      revision: expectedRevision,
      "banners.1": { $exists: true },
      "banners._id": bannerId,
    },
    {
      $pull: { banners: { _id: bannerId } },
      $addToSet: {
        pending_cleanup_urls: {
          $each: [banner.desktop_image_url, banner.mobile_image_url],
        },
      },
      $inc: { revision: 1 },
      $set: { storefront_sync_pending: true },
    },
    { new: true, runValidators: true },
  );

  if (!updated) {
    return throwMutationConflict();
  }

  return serializeAdminHomeBannerSet(await synchronizeBannerSet(updated));
}

export async function syncAdminHomeBanners() {
  return serializeAdminHomeBannerSet(
    await synchronizeBannerSet(await requireBannerSet()),
  );
}
