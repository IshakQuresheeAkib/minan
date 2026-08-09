import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { HomeBannerSet } from "../models/HomeBannerSet.js";
import { DEFAULT_HOME_BANNERS } from "./defaultHomeBanners.js";

async function seedHomeBanners(): Promise<void> {
  await connectDB();

  const result = await HomeBannerSet.findOneAndUpdate(
    { key: "homepage" },
    {
      $setOnInsert: {
        key: "homepage",
        revision: 1,
        banners: DEFAULT_HOME_BANNERS.map((banner) => ({ ...banner })),
        storefront_sync_pending: false,
        pending_cleanup_urls: [],
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await revalidateStorefront(["home-banners"]);
  console.log(
    `Home banner seed complete: ${result.banners.length} banners at revision ${result.revision}`,
  );
}

seedHomeBanners()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Home banner seed failed:", error);
    await disconnectDB();
    process.exit(1);
  });
