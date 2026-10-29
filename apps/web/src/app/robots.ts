import type { MetadataRoute } from "next";

import { getAbsoluteUrl, siteConfig } from "@/config/site.config";

const privateDisallowPaths = [
  "/api/",
  "/admin/",
  "/checkout/",
  "/payment/",
  "/account/",
  "/orders?*",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateDisallowPaths,
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
        disallow: privateDisallowPaths,
      },
    ],
    sitemap: getAbsoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
