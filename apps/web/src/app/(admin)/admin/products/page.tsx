import {
  AdminProducts,
  type AdminProductAppliedFilters,
} from "@/features/admin/components/AdminProducts";
import type { AdminProductStatusFilter } from "@/features/admin/actions/products.actions";

export const metadata = {
  title: "Products",
};

type AdminProductsPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    search?: string | string[];
    category_id?: string | string[];
    status?: string | string[];
  }>;
};

function getFirstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parsePage(value: string): number {
  const page = Number.parseInt(value, 10);
  return Number.isNaN(page) ? 1 : Math.max(1, page);
}

function parseStatus(value: string): AdminProductStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  const appliedFilters: AdminProductAppliedFilters = {
    page: parsePage(getFirstParam(params.page)),
    search: getFirstParam(params.search).trim(),
    categoryId: getFirstParam(params.category_id).trim(),
    status: parseStatus(getFirstParam(params.status)),
  };

  return <AdminProducts appliedFilters={appliedFilters} />;
}
