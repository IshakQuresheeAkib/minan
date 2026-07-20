import { CategoryGridCard } from "@/features/home/components/CategoryGridCard";
import { ProductCard } from "@/features/products/components/ProductCard";
import type { Product } from "@/features/products/schemas/product.schema";
import {
  mapProductToCard,
  type ProductFilterOptions,
} from "@/features/products/services/product.service";
import type { ApiList } from "@/types/api.types";

type HomeCategory = ProductFilterOptions["categories"][number];

export type HomeCategoryProductGroup = {
  category: HomeCategory;
  products: ApiList<Product>;
};

type ProductsSectionProps = {
  activeCategorySlug?: string;
  categoryGroups: HomeCategoryProductGroup[];
};

export function ProductsSection({
  activeCategorySlug,
  categoryGroups,
}: ProductsSectionProps) {
  const activeGroup = activeCategorySlug
    ? categoryGroups.find(
        (group) => group.category.slug === activeCategorySlug,
      )
    : undefined;
  const visibleGroups = activeCategorySlug
    ? activeGroup && activeGroup.products.data.length > 0
      ? [activeGroup]
      : []
    : categoryGroups.filter((group) => group.products.data.length > 0);

  if (visibleGroups.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-foreground/70">
        {activeCategorySlug
          ? "No products available in this category yet."
          : "No products available yet."}
      </p>
    );
  }

  return (
    <section className="space-y-10 xl:space-y-12" aria-label="Products by category">
      {visibleGroups.map((group, groupIndex) => (
        <CategoryProductGrid
          key={group.category.slug}
          group={group}
          imagePriority={groupIndex === 0}
        />
      ))}
    </section>
  );
}

type CategoryProductGridProps = {
  group: HomeCategoryProductGroup;
  imagePriority: boolean;
};

function CategoryProductGrid({
  group,
  imagePriority,
}: CategoryProductGridProps) {
  const { category, products } = group;
  const cardProducts = products.data.slice(0, 7).map(mapProductToCard);
  const viewMoreHref = `/products?category=${encodeURIComponent(category.slug)}`;
  const compactHasMore = products.total > 5;
  const desktopHasMore = products.total > 7;
  const titleId = `home-category-${category.slug}`;

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        {category.name}
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <CategoryGridCard
          imagePriority={imagePriority}
          imageUrl={category.image_url}
          name={category.name}
          slug={category.slug}
        />
        {cardProducts.map((product, index) => {
          const isCompactTerminal = index === 4 && compactHasMore;
          const isDesktopOnly = index > 4;
          const isDesktopTerminal = index === 6 && desktopHasMore;

          if (isCompactTerminal) {
            return (
              <div key={product.slug} className="contents">
                <div className="h-full xl:hidden">
                  <ProductCard
                    product={product}
                    wholeCardCta={{
                      href: viewMoreHref,
                      label: `View more ${category.name} products`,
                      overlayText: "View more",
                    }}
                  />
                </div>
                <div className="hidden h-full xl:block">
                  <ProductCard product={product} />
                </div>
              </div>
            );
          }

          return (
            <div
              key={product.slug}
              className={isDesktopOnly ? "hidden h-full xl:block" : "h-full"}
            >
              <ProductCard
                imagePriority={imagePriority && index === 0}
                product={product}
                wholeCardCta={
                  isDesktopTerminal
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
