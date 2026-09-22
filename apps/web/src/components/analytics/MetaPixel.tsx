"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { env } from "@/config/env";
import {
  initializeMetaPixel,
  setMetaPixelConsent,
  trackPixelEvent,
} from "@/lib/analytics/pixel";

export function MetaPixel() {
  const pixelId = env.metaPixelId.trim();
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!pixelId) {
      return;
    }

    if (!initialized.current) {
      initializeMetaPixel(pixelId);
      initialized.current = true;
    }

    setMetaPixelConsent("grant");
    trackPixelEvent("PageView");
  }, [pathname, pixelId]);

  return null;
}
