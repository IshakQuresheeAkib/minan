import {
  HomeCatalogClient,
  type HomeCatalogCategory,
} from "@/features/home/components/HomeCatalogClient";
import {
  CategoryProductGrid,
  type HomeCategoryProductGroup,
} from "@/features/home/components/ProductsSection";

type HomeCatalogProps = {
  categoryGroups: HomeCategoryProductGroup[];
};

export function HomeCatalog({ categoryGroups }: HomeCatalogProps) {
  const categories = categoryGroups.map<HomeCatalogCategory>((group) => ({
    hasProducts: group.products.total > 0,
    imageUrl: group.category.image_url,
    name: group.category.name,
    slug: group.category.slug,
  }));

  return (
    <HomeCatalogClient categories={categories}>
      {categoryGroups.map((group) => (
        <div key={group.category.slug} data-home-category={group.category.slug}>
          {group.products.total > 0 ? (
            <CategoryProductGrid group={group} />
          ) : (
            <p className="py-10 text-center text-sm text-foreground/70">
              No products available in this category yet.
            </p>
          )}
        </div>
      ))}
    </HomeCatalogClient>
  );
}
