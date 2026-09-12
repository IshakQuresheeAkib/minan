import { getCollectionPath } from "@/constants/routes";
import { CategoryGridCard } from "@/features/home/components/CategoryGridCard";
import { ProductCard } from "@/features/products/components/ProductCard";
import {
  mapProductToCard,
  type HomeCatalogProductGroup,
} from "@/features/products/services/product.service";

export type HomeCategoryProductGroup = HomeCatalogProductGroup;

type ProductsSectionProps = {
  categoryGroups: HomeCategoryProductGroup[];
};

export function ProductsSection({ categoryGroups }: ProductsSectionProps) {
  const visibleGroups = categoryGroups.filter(
    (group) => group.products.data.length > 0,
  );

  if (visibleGroups.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-foreground/70">
        No products available yet.
      </p>
    );
  }

  return (
    <section className="space-y-10 xl:space-y-12" aria-label="Products by category">
      {visibleGroups.map((group) => (
        <CategoryProductGrid key={group.category.slug} group={group} />
      ))}
    </section>
  );
}

type CategoryProductGridProps = {
  group: HomeCategoryProductGroup;
  products?: HomeCategoryProductGroup["products"]["data"];
  showViewMore?: boolean;
};

export function CategoryProductGrid({
  group,
  products = group.products.data,
  showViewMore = true,
}: CategoryProductGridProps) {
  const { category } = group;
  const visibleProducts = showViewMore ? products.slice(0, 7) : products;
  const cardProducts = visibleProducts.map(mapProductToCard);
  const viewMoreHref = getCollectionPath(category.slug);
  const compactHasMore = showViewMore && group.products.total > 5;
  const desktopHasMore = showViewMore && group.products.total > 7;
  const titleId = `home-category-${category.slug}`;

  return (
    <section
      aria-labelledby={titleId}
      className="[content-visibility:auto] [contain-intrinsic-size:auto_900px]"
    >
      <h2 id={titleId} className="sr-only">
        {category.name}
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <CategoryGridCard
          imageUrl={category.image_url}
          name={category.name}
          slug={category.slug}
        />
        {cardProducts.map((product, index) => {
          const isCompactTerminal = index === 4 && compactHasMore;
          const isDesktopOnly = showViewMore && index > 4;
          const isDesktopTerminal = index === 6 && desktopHasMore;

          return (
            <div
              key={product.slug}
              className={isDesktopOnly ? "hidden h-full xl:block" : "h-full"}
            >
              <ProductCard
                product={product}
                wholeCardCta={
                  isCompactTerminal
                    ? {
                        compactOnly: true,
                        href: viewMoreHref,
                        label: `View more ${category.name} products`,
                        overlayText: "View more",
                      }
                    : isDesktopTerminal
                    ? {
                        href: viewMoreHref,
                        label: `View more ${category.name} products`,
                        overlayText: "View more",
                      }
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
