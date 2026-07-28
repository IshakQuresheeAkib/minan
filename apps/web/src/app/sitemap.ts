import type { MetadataRoute } from "next";

import { publicRoutes } from "@/constants/routes";
import { getAbsoluteUrl } from "@/config/site.config";
import { getProducts } from "@/features/products/services/product.service";

const staticRoutes = [publicRoutes.home, publicRoutes.products];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: getAbsoluteUrl(route),
    lastModified: now,
    changeFrequency: route === publicRoutes.home ? "daily" : "weekly",
    priority: route === publicRoutes.home ? 1 : 0.8,
  }));

  try {
    const { data: products } = await getProducts({ limit: 1000 });

    routes.push(
      ...products.map((product) => ({
        url: getAbsoluteUrl(`/products/${product.slug}`),
        lastModified: new Date(product.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );
  } catch {
    // Keep sitemap generation available even if the API is temporarily down.
  }

  return routes;
}
