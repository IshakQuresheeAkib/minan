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
const brandId = `${siteConfig.url}/#brand`;

export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type BrandFaqItem = {
  question: string;
  answer: string;
};

export const brandFaqs: readonly BrandFaqItem[] = [
  {
    question: "What is MINAN?",
    answer:
      "MINAN is a modern Bangladeshi fashion house and clothing brand headquartered in Sylhet, Bangladesh. MINAN crafts high-quality menswear, ethnic panjabis, formal and casual shirts, trousers, womenswear, and footwear for customers across Bangladesh.",
  },
  {
    question: "Where is the official MINAN store located?",
    answer:
      "The official MINAN location is at Kumarpara Point, Opposite of Forid & Brothers, Sylhet, Bangladesh, 3100. Customers can visit or order online with nationwide home delivery.",
  },
  {
    question: "Does MINAN deliver all across Bangladesh?",
    answer:
      "Yes, MINAN provides nationwide home delivery across all 64 districts in Bangladesh, including expedited 24-48 hour delivery inside Sylhet city and 2-4 business days nationwide.",
  },
  {
    question: "What payment methods are accepted by MINAN?",
    answer:
      "MINAN accepts secure online prepayment via bKash as well as Cash on Delivery (COD) across Bangladesh with an advance delivery fee.",
  },
  {
    question: "How can I contact MINAN customer support or order via WhatsApp?",
    answer:
      "You can contact MINAN directly by calling or messaging +8801799854465, or by connecting through the official Facebook page (@minanclothing) and Instagram (@minanf9).",
  },
] as const;

export function getHomeStructuredData(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": organizationId,
        "@type": "Organization",
        name: siteConfig.name,
        legalName: "MINAN Clothing",
        alternateName: ["MINAN", "MINAN Clothing", "MINAN Bangladesh", "মিনান"],
        url: siteConfig.url,
        logo: getAbsoluteUrl("/logo.png"),
        image: getAbsoluteUrl("/logo.png"),
        telephone: siteConfig.contact.phone,
        sameAs: [
          siteConfig.socials.facebook,
          siteConfig.socials.instagram,
          siteConfig.socials.tiktok,
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.streetAddress,
          addressLocality: siteConfig.city,
          postalCode: siteConfig.postalCode,
          addressCountry: "BD",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: siteConfig.contact.phone,
          contactType: "customer service",
          areaServed: "BD",
          availableLanguage: ["English", "Bengali"],
        },
      },
      {
        "@id": brandId,
        "@type": "Brand",
        name: siteConfig.name,
        url: siteConfig.url,
        logo: getAbsoluteUrl("/logo.png"),
        description: siteConfig.description,
      },
      {
        "@id": websiteId,
        "@type": "WebSite",
        name: siteConfig.name,
        alternateName: "MINAN Clothing",
        url: siteConfig.url,
        description: siteConfig.description,
        inLanguage: "en-BD",
        publisher: { "@id": organizationId },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/products?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: brandFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
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
