import "dotenv/config";

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { Collection } from "mongodb";
import type { Types } from "mongoose";

import { connectDB, disconnectDB } from "../config/db.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { HomeBannerSet } from "../models/HomeBannerSet.js";
import {
  type LegacyHomeBanner,
  planHomeBannerAltTextMigration,
} from "./homeBannerAltTextMigration.js";

type LegacyHomeBannerSet = {
  _id: Types.ObjectId;
  key: "homepage";
  revision: number;
  banners: LegacyHomeBanner<Types.ObjectId>[];
  storefront_sync_pending?: boolean;
};

function getDescriptionsPath(args: readonly string[]): string | null {
  const inline = args.find((arg) => arg.startsWith("--descriptions="));
  if (inline) {
    return inline.slice("--descriptions=".length);
  }

  const index = args.indexOf("--descriptions");
  if (index === -1) {
    return null;
  }

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("--descriptions requires a JSON file path");
  }

  return value;
}

async function loadDescriptions(
  filePath: string | null,
): Promise<Record<string, string>> {
  if (!filePath) {
    return {};
  }

  const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The descriptions file must contain a JSON object");
  }

  const descriptions: Record<string, string> = {};
  for (const [bannerId, description] of Object.entries(parsed)) {
    if (typeof description !== "string") {
      throw new Error(`Description for banner ${bannerId} must be a string`);
    }
    descriptions[bannerId] = description;
  }

  return descriptions;
}

export async function migrateHomeBannerAltText(
  applyChanges: boolean,
  descriptionsPath: string | null,
): Promise<void> {
  await connectDB();

  const collection = HomeBannerSet.collection as unknown as Collection<LegacyHomeBannerSet>;
  const bannerSet = await collection.findOne({ key: "homepage" });
  if (!bannerSet) {
    console.log("No home banner singleton exists; the seed will create described banners.");
    return;
  }

  const descriptions = await loadDescriptions(descriptionsPath);
  const plan = planHomeBannerAltTextMigration(
    bannerSet.banners,
    descriptions,
  );

  console.log(
    `${applyChanges ? "APPLY" : "DRY RUN"}: ${plan.changes.length} banner descriptions to backfill, ${plan.unresolved.length} unresolved.`,
  );
  for (const unresolved of plan.unresolved) {
    console.error(
      `Missing description for ${unresolved.banner_id}: desktop=${unresolved.desktop_image_url}, mobile=${unresolved.mobile_image_url}`,
    );
  }

  if (plan.unresolved.length > 0) {
    throw new Error(
      "Provide meaningful descriptions for every unresolved banner with --descriptions <path>.",
    );
  }

  if (plan.changes.length === 0) {
    console.log("Home banner alt-text migration is already complete.");
    return;
  }

  for (const change of plan.changes) {
    console.log(`Backfill ${change.banner_id}: ${change.alt_text}`);
  }

  if (!applyChanges) {
    console.log("No records changed. Re-run with --apply after reviewing every description.");
    return;
  }

  const result = await collection.updateOne(
    { _id: bannerSet._id, revision: bannerSet.revision },
    {
      $set: {
        banners: plan.banners,
        storefront_sync_pending: true,
      },
      $inc: { revision: 1 },
    },
  );
  if (result.matchedCount !== 1) {
    throw new Error(
      "Home banners changed while the migration was running. Re-run the dry run and apply again.",
    );
  }

  const nextRevision = bannerSet.revision + 1;
  const revalidated = await revalidateStorefront(["home-banners"]);
  if (revalidated) {
    await collection.updateOne(
      { _id: bannerSet._id, revision: nextRevision },
      { $set: { storefront_sync_pending: false } },
    );
  }

  console.log(
    `Home banner alt-text migration complete at revision ${nextRevision}${revalidated ? "." : "; storefront sync remains pending."}`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const apply = process.argv.includes("--apply");
  const descriptionsPath = getDescriptionsPath(process.argv.slice(2));

  migrateHomeBannerAltText(apply, descriptionsPath)
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (error: unknown) => {
      console.error("Home banner alt-text migration failed:", error);
      await disconnectDB();
      process.exit(1);
    });
}
