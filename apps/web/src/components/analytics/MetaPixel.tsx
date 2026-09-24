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

    if (!initialized.current) {
      initializeMetaPixel(pixelId);
      initialized.current = true;
    }

    trackPixelEvent("PageView");
  }, [pathname, pixelId]);

  return null;
}
