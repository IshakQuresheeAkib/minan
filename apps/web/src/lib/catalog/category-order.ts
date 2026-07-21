export const CATEGORY_SLUG_ORDER = [
  "t-shirts",
  "shirts",
  "pants",
  "panjabi",
  "footwear",
  "accessories",
  "women",
  "kids",
  "winter",
] as const;

const categoryRank = new Map<string, number>(
  CATEGORY_SLUG_ORDER.map((slug, index) => [slug, index]),
);

type CategoryWithSlug = {
  slug: string;
};

export function sortCategories<T extends CategoryWithSlug>(
  categories: readonly T[],
): T[] {
  return [...categories].sort((first, second) => {
    const firstRank = categoryRank.get(first.slug.toLowerCase());
    const secondRank = categoryRank.get(second.slug.toLowerCase());

    if (firstRank !== undefined && secondRank !== undefined) {
      return firstRank - secondRank;
    }

    if (firstRank !== undefined) {
      return -1;
    }

    if (secondRank !== undefined) {
      return 1;
    }

    return first.slug.localeCompare(second.slug);
  });
}
