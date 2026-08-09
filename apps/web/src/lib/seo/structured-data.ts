import { getAbsoluteUrl, siteConfig } from "@/config/site.config";
import { getCollectionPath, getProductPath } from "@/constants/routes";
import type { ProductDetail } from "@/features/products/schemas/product.schema";

export type JsonLdObject = {
  [key: string]: JsonLdValue;
};

export type JsonLdValue =
  | JsonLdObject
  | JsonLdValue[]
  | boolean
  | null
  | number
  | string;

const organizationId = `${siteConfig.url}/#organization`;
const websiteId = `${siteConfig.url}/#website`;

export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function getHomeStructuredData(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": organizationId,
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
        logo: getAbsoluteUrl("/logo.png"),
        address: {
          "@type": "PostalAddress",
          addressCountry: "BD",
          addressLocality: siteConfig.city,
        },
      },
      {
        "@id": websiteId,
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        inLanguage: "en-BD",
        publisher: { "@id": organizationId },
      },
    ],
  };
}

export function getProductStructuredData(
  product: ProductDetail,
): JsonLdObject {
  const productPath = getProductPath(product.slug);
  const productUrl = getAbsoluteUrl(productPath);
  const breadcrumbItems: JsonLdObject[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteConfig.url,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Products",
      item: getAbsoluteUrl("/products"),
    },
  ];

  if (product.category) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: breadcrumbItems.length + 1,
      name: product.category.name,
      item: getAbsoluteUrl(getCollectionPath(product.category.slug)),
    });
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: product.name,
    item: productUrl,
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${productUrl}#product`,
        "@type": "Product",
        name: product.name,
        description: product.description,
        ...(product.images.length > 0 ? { image: product.images } : {}),
        sku: product._id,
        category: product.category?.name ?? "Fashion",
        brand: {
          "@type": "Brand",
          name: siteConfig.name,
        },
        offers: {
          "@type": "Offer",
          url: productUrl,
          price: product.discounted_price,
          priceCurrency: "BDT",
          availability: product.is_active
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@id": organizationId },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
    ],
  };
}

export function getCollectionStructuredData(category: {
  name: string;
  slug: string;
}): JsonLdObject {
  const collectionUrl = getAbsoluteUrl(getCollectionPath(category.slug));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${category.name} Collection`,
        url: collectionUrl,
        description: `Shop ${category.name.toLowerCase()} from the latest MINAN collection in Bangladesh.`,
        isPartOf: { "@id": websiteId },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Products",
            item: getAbsoluteUrl("/products"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: collectionUrl,
          },
        ],
      },
    ],
  };
}