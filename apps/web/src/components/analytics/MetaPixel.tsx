"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { env } from "@/config/env";
import { initializeMetaPixel, trackPixelEvent } from "@/lib/analytics/pixel";
import { isAnalyticsAllowed } from "@/lib/analytics/routes";

export function MetaPixel() {
  const pixelId = env.metaPixelId.trim();
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!pixelId || !isAnalyticsAllowed(pathname)) {
      return;
    }

    const track = () => {
      if (!initialized.current) {
        initializeMetaPixel(pixelId);
        initialized.current = true;
      }
      trackPixelEvent("PageView");
    };

    if (typeof document !== "undefined" && (document as { prerendering?: boolean }).prerendering) {
      document.addEventListener("prerenderingchange", track, { once: true });
      return () => {
        document.removeEventListener("prerenderingchange", track);
      };
    }

    track();
  }, [pathname, pixelId]);

  return null;
}
