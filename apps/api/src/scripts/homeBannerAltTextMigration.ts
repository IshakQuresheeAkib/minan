import { DEFAULT_HOME_BANNERS } from "../seed/defaultHomeBanners.js";

export const LEGACY_GENERIC_HOME_BANNER_ALT_TEXT =
  "MINAN fashion collection campaign";

const MIN_ALT_TEXT_LENGTH = 5;
const MAX_ALT_TEXT_LENGTH = 160;

export type LegacyHomeBanner<TId = unknown> = {
  _id: TId;
  alt_text?: unknown;
  desktop_image_url: string;
  mobile_image_url: string;
};

type BannerAltTextChange = {
  banner_id: string;
  alt_text: string;
};

type UnresolvedHomeBanner = {
  banner_id: string;
  desktop_image_url: string;
  mobile_image_url: string;
};

export type HomeBannerAltTextMigrationPlan<TId> = {
  banners: Array<{
    _id: TId;
    alt_text?: string;
    desktop_image_url: string;
    mobile_image_url: string;
  }>;
  changes: BannerAltTextChange[];
  unresolved: UnresolvedHomeBanner[];
};

function normalizeAltText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (
    normalized.length < MIN_ALT_TEXT_LENGTH ||
    normalized.length > MAX_ALT_TEXT_LENGTH ||
    normalized === LEGACY_GENERIC_HOME_BANNER_ALT_TEXT
  ) {
    return null;
  }

  return normalized;
}

function getSeededAltText<TId>(
  banner: LegacyHomeBanner<TId>,
): string | null {
  const seededBanner = DEFAULT_HOME_BANNERS.find(
    (candidate) =>
      candidate.desktop_image_url === banner.desktop_image_url &&
      candidate.mobile_image_url === banner.mobile_image_url,
  );

  return seededBanner?.alt_text ?? null;
}

export function planHomeBannerAltTextMigration<TId>(
  banners: readonly LegacyHomeBanner<TId>[],
  descriptionsByBannerId: Readonly<Record<string, string>> = {},
): HomeBannerAltTextMigrationPlan<TId> {
  const changes: BannerAltTextChange[] = [];
  const unresolved: UnresolvedHomeBanner[] = [];
  const migratedBanners = banners.map((banner) => {
    const bannerWithoutAltText = {
      _id: banner._id,
      desktop_image_url: banner.desktop_image_url,
      mobile_image_url: banner.mobile_image_url,
    };
    const existingAltText = normalizeAltText(banner.alt_text);
    if (existingAltText) {
      return { ...bannerWithoutAltText, alt_text: existingAltText };
    }

    const bannerId = String(banner._id);
    const explicitAltText = Object.hasOwn(
      descriptionsByBannerId,
      bannerId,
    )
      ? normalizeAltText(descriptionsByBannerId[bannerId])
      : null;

    if (
      Object.hasOwn(descriptionsByBannerId, bannerId) &&
      explicitAltText === null
    ) {
      throw new Error(
        `Description for banner ${bannerId} must be 5-160 characters and cannot use the legacy generic text.`,
      );
    }

    const altText = explicitAltText ?? getSeededAltText(banner);
    if (!altText) {
      unresolved.push({
        banner_id: bannerId,
        desktop_image_url: banner.desktop_image_url,
        mobile_image_url: banner.mobile_image_url,
      });
      return bannerWithoutAltText;
    }

    changes.push({ banner_id: bannerId, alt_text: altText });
    return { ...bannerWithoutAltText, alt_text: altText };
  });

  return { banners: migratedBanners, changes, unresolved };
}
