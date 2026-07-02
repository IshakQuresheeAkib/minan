import { ProductGrid } from "@/features/products/components/ProductGrid";
import {
  getProducts,
  mapProductToCard,
} from "@/features/products/services/product.service";

export const metadata = {
  title: "Products",
};

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    search?: string | string[];
  }>;
};

function getFirstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = getFirstParam(params.category)?.trim();
  const search = getFirstParam(params.search)?.trim();
  const { data } = await getProducts({ category, search });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          {search ? `Search results for "${search}"` : "Products"}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {search
            ? "Browse matching pieces from the current MINAN collection."
            : "Premium daily wear selected for fast browsing and easy ordering."}
        </p>
      </div>
      <ProductGrid products={data.map(mapProductToCard)} />
    </section>
  );
}
