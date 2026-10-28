import type { MetadataRoute } from "next";

import { getAbsoluteUrl, siteConfig } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/checkout/",
          "/payment/",
          "/account/",
          "/orders?*",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: ["/", "/products", "/collections/", "/llms.txt", "/llms-full.txt"],
        disallow: [
          "/api/",
          "/admin/",
          "/checkout/",
          "/payment/",
          "/account/",
        ],
      },
    ],
    sitemap: getAbsoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
