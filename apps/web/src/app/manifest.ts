import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MINAN — Premium Fashion & Clothing",
    short_name: "MINAN",
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7F4",
    theme_color: "#974822",
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
