import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { getCollectionPath, publicRoutes } from "@/constants/routes";
import type {
  ProductCategory,
  ProductSubcategory,
} from "@/features/products/schemas/product.schema";

type ProductBreadcrumbsProps = {
  category: ProductCategory | null;
  subcategory: ProductSubcategory | null;
  productName: string;
};

function HomeIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 7.609c.352 0 .69.122.96.343l.111.1 6.25 6.25v.001a1.5 1.5 0 0 1 .445 1.071v7.5a.89.89 0 0 1-.891.891H9.125a.89.89 0 0 1-.89-.89v-7.5l.006-.149a1.5 1.5 0 0 1 .337-.813l.1-.11 6.25-6.25c.285-.285.67-.444 1.072-.444Zm5.984 7.876L16 9.5l-5.984 5.985v6.499h11.968z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth=".094"
      />
    </svg>
  );
}

function ChevronSeparator() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="m14.413 10.663-6.25 6.25a.939.939 0 1 1-1.328-1.328L12.42 10 6.836 4.413a.939.939 0 1 1 1.328-1.328l6.25 6.25a.94.94 0 0 1-.001 1.328"
        fill="currentColor"
      />
    </svg>
  );
}

export function ProductBreadcrumbs({
  category,
  subcategory,
  productName,
}: ProductBreadcrumbsProps) {
  return (
    <Breadcrumb aria-label="Breadcrumb" className="mb-6 hidden lg:block">
      <BreadcrumbList className="justify-center gap-2 text-sm font-medium text-gray-500 sm:gap-2">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              href={publicRoutes.home}
              aria-label="Home"
              className="text-slate-600 hover:text-foreground"
            >
              <HomeIcon />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-slate-300 [&>svg]:size-5">
          <ChevronSeparator />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={publicRoutes.products}>Products</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-slate-300 [&>svg]:size-5">
          <ChevronSeparator />
        </BreadcrumbSeparator>
        {category ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={getCollectionPath(category.slug)}>
                  {category.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-300 [&>svg]:size-5">
              <ChevronSeparator />
            </BreadcrumbSeparator>
          </>
        ) : null}
        {category && subcategory ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`${getCollectionPath(category.slug)}?subcategory=${encodeURIComponent(subcategory.slug)}`}
                >
                  {subcategory.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-300 [&>svg]:size-5">
              <ChevronSeparator />
            </BreadcrumbSeparator>
          </>
        ) : null}
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium text-indigo-500">
            {productName}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
