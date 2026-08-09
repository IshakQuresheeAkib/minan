import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { HomeBannerSet } from "../models/HomeBannerSet.js";

async function seedHomeBanners(): Promise<void> {
  await connectDB();

  const result = await HomeBannerSet.findOneAndUpdate(
    { key: "homepage" },
    {
      $setOnInsert: {
        key: "homepage",
        revision: 1,
        banners: [
          {
            alt_text:
              "Three men wearing brown, sage green, and ivory MINAN panjabi in an arched interior",
            desktop_image_url: "/hero/limited-offer.webp",
            mobile_image_url: "/hero/limited-offer.webp",
          },
          {
            alt_text:
              "Two models wearing maroon embroidered MINAN panjabi from the Eid collection",
            desktop_image_url: "/hero/new-arrivals.jpg",
            mobile_image_url: "/hero/new-arrivals.jpg",
          },
        ],
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
