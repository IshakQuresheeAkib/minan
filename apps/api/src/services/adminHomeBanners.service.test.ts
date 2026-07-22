import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
}));

vi.mock("../models/HomeBannerSet.js", () => ({
  HomeBannerSet: {
    findOne: mocks.findOne,
    findOneAndUpdate: mocks.findOneAndUpdate,
  },
}));
vi.mock("../lib/revalidateStorefront.js", () => ({
  revalidateStorefront: vi.fn().mockResolvedValue(false),
}));
vi.mock("../lib/cloudinary.js", () => ({
  getManagedPublicIdFromUrl: vi.fn().mockReturnValue("minan/admin/banner"),
}));
vi.mock("./adminMediaCleanup.service.js", () => ({
  cleanupRemovedManagedImages: vi.fn(),
}));

import {
  createAdminHomeBanner,
  deleteAdminHomeBanner,
} from "./adminHomeBanners.service.js";

const imageUrl =
  "https://res.cloudinary.com/minan/image/upload/v1/minan/admin/banner.webp";

function bannerSet(count: number, revision = 1) {
  const banners = Array.from({ length: count }, () => ({
    _id: new Types.ObjectId(),
    desktop_image_url: imageUrl,
    mobile_image_url: imageUrl,
  }));

  return {
    _id: new Types.ObjectId(),
    revision,
    banners: Object.assign(banners, {
      id(id: Types.ObjectId) {
        return banners.find((banner) => banner._id.equals(id)) ?? null;
      },
    }),
    storefront_sync_pending: false,
    pending_cleanup_urls: [],
  };
}

describe("admin home banner concurrency guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects creation when five banners already exist", async () => {
    mocks.findOne.mockResolvedValue(bannerSet(5));

    await expect(
      createAdminHomeBanner({
        desktop_image_url: imageUrl,
        mobile_image_url: imageUrl,
        expected_revision: 1,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects removal of the final banner", async () => {
    const current = bannerSet(1);
    mocks.findOne.mockResolvedValue(current);

    await expect(
      deleteAdminHomeBanner(current.banners[0]?._id.toString() ?? "", 1),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("turns a lost compare-and-swap into a revision conflict", async () => {
    const current = bannerSet(4);
    mocks.findOne.mockResolvedValue(current);
    mocks.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      createAdminHomeBanner({
        desktop_image_url: imageUrl,
        mobile_image_url: imageUrl,
        expected_revision: 1,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
