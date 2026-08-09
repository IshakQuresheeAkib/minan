import type { MetadataRoute } from "next";
import { connection } from "next/server";

import {
  getCollectionPath,
  getProductPath,
  publicRoutes,
} from "@/constants/routes";
import { getAbsoluteUrl } from "@/config/site.config";
import {
  getCachedProductFilterOptions,
  getCachedProducts,
} from "@/features/products/services/product.cache";

const staticRoutes = [publicRoutes.home, publicRoutes.products];
const SITEMAP_PAGE_SIZE = 100;

async function getAllProducts() {
  const products = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCachedProducts({
      page,
      limit: SITEMAP_PAGE_SIZE,
    });

    products.push(...response.data);
    hasMore = response.hasMore && response.data.length > 0;
    page += 1;
  }

  return products;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: getAbsoluteUrl(route),
    changeFrequency: route === publicRoutes.home ? "daily" : "weekly",
    priority: route === publicRoutes.home ? 1 : 0.8,
  }));

  const filterOptionsPromise = getCachedProductFilterOptions().catch(
    (error: unknown) => {
      console.error("Unable to include collection URLs in the sitemap", error);
      return null;
    },
  );
  const products = await getAllProducts();

  routes.push(
    ...products.map((product) => ({
      url: getAbsoluteUrl(getProductPath(product.slug)),
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  const filterOptions = await filterOptionsPromise;

  if (filterOptions) {
    routes.push(
      ...filterOptions.categories.map((category) => ({
        url: getAbsoluteUrl(getCollectionPath(category.slug)),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    );
  }

  return routes;
}
