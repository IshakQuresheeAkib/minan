import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { publicRoutes } from "@/constants/routes";
import type { ProductCategory } from "@/features/products/schemas/product.schema";

type ProductBreadcrumbsProps = {
  category: ProductCategory | null;
  productName: string;
};

export function ProductBreadcrumbs({
  category,
  productName,
}: ProductBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 hidden text-sm text-foreground/70 lg:block"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href={publicRoutes.home}
            className="transition-colors hover:text-foreground"
          >
            Home
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3.5" />
        </li>
        {category ? (
          <>
            <li>
              <Link
                href={`${publicRoutes.products}?category=${category.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {category.name}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
          </>
        ) : (
          <>
            <li>
              <Link
                href={publicRoutes.products}
                className="transition-colors hover:text-foreground"
              >
                Products
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
          </>
        )}
        <li>
          <span aria-current="page" className="font-medium text-foreground">
            {productName}
          </span>
        </li>
      </ol>
    </nav>
  );
}
