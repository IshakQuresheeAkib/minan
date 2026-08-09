import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  connectDBMock,
  findOneMock,
  revalidateStorefrontMock,
  updateOneMock,
} = vi.hoisted(() => ({
  connectDBMock: vi.fn(),
  findOneMock: vi.fn(),
  revalidateStorefrontMock: vi.fn(),
  updateOneMock: vi.fn(),
}));

vi.mock("../config/db.js", () => ({
  connectDB: connectDBMock,
  disconnectDB: vi.fn(),
}));

vi.mock("../lib/revalidateStorefront.js", () => ({
  revalidateStorefront: revalidateStorefrontMock,
}));

vi.mock("../models/HomeBannerSet.js", () => ({
  HomeBannerSet: {
    collection: {
      findOne: findOneMock,
      updateOne: updateOneMock,
    },
  },
}));

import { migrateHomeBannerAltText } from "./migrate-home-banner-alt-text.js";

describe("home banner alt-text migration runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectDBMock.mockResolvedValue(undefined);
    updateOneMock.mockResolvedValue({ matchedCount: 1 });
  });

  it("atomically guards the revision and clears pending sync after revalidation", async () => {
    findOneMock.mockResolvedValue({
      _id: "set-id",
      key: "homepage",
      revision: 7,
      banners: [
        {
          _id: "banner-id",
          desktop_image_url: "/hero/limited-offer.webp",
          mobile_image_url: "/hero/limited-offer.webp",
        },
      ],
    });
    revalidateStorefrontMock.mockResolvedValue(true);

    await migrateHomeBannerAltText(true, null);

    expect(updateOneMock).toHaveBeenNthCalledWith(
      1,
      { _id: "set-id", revision: 7 },
      {
        $set: {
          banners: [
            expect.objectContaining({
              _id: "banner-id",
              alt_text:
                "Three men wearing brown, sage green, and ivory MINAN panjabi in an arched interior",
            }),
          ],
          storefront_sync_pending: true,
        },
        $inc: { revision: 1 },
      },
    );
    expect(revalidateStorefrontMock).toHaveBeenCalledWith(["home-banners"]);
    expect(updateOneMock).toHaveBeenNthCalledWith(
      2,
      { _id: "set-id", revision: 8 },
      { $set: { storefront_sync_pending: false } },
    );
  });

  it("refuses to write when a custom legacy banner remains unresolved", async () => {
    findOneMock.mockResolvedValue({
      _id: "set-id",
      key: "homepage",
      revision: 7,
      banners: [
        {
          _id: "custom-id",
          desktop_image_url: "custom-desktop.webp",
          mobile_image_url: "custom-mobile.webp",
        },
      ],
    });

    await expect(migrateHomeBannerAltText(true, null)).rejects.toThrow(
      "Provide meaningful descriptions for every unresolved banner",
    );
    expect(updateOneMock).not.toHaveBeenCalled();
  });
});
