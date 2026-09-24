"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

import { env } from "@/config/env";
import { getGa4MeasurementId } from "@/lib/analytics/ga4";
import {
  configureGa4RouteScoping,
  isAnalyticsAllowed,
  setGa4Disabled,
} from "@/lib/analytics/routes";

type GtagFunction = (...args: unknown[]) => void;

function getWindowGtag(): GtagFunction | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const globalScope = window as unknown as { gtag?: GtagFunction };
  return typeof globalScope.gtag === "function" ? globalScope.gtag : undefined;
}

export function Ga4Analytics() {
  const measurementId = getGa4MeasurementId(env.ga4Id);
  const pathname = usePathname();
  const scriptLoaded = useRef(false);

  if (measurementId && typeof window !== "undefined") {
    setGa4Disabled(measurementId, !isAnalyticsAllowed(pathname));
  }

  useEffect(() => {
    if (!measurementId) {
      return;
    }

    const cleanup = configureGa4RouteScoping(measurementId);
    return cleanup;
  }, [measurementId]);

  useEffect(() => {
    if (!measurementId) {
      return;
    }

    const allowed = isAnalyticsAllowed(pathname);
    setGa4Disabled(measurementId, !allowed);

    if (allowed && scriptLoaded.current) {
      const gtag = getWindowGtag();
      if (gtag) {
        gtag("event", "page_view", {
          page_path: pathname,
          page_location: window.location.origin + pathname,
        });
      }
    }
  }, [measurementId, pathname]);

  if (!measurementId || !isAnalyticsAllowed(pathname)) {
    return null;
  }

  return (
    <>
      <Script
        id="_next-ga-init"
        dangerouslySetInnerHTML={{
          __html: `
window['dataLayer'] = window['dataLayer'] || [];
function gtag(){window['dataLayer'].push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { send_page_view: false });
if (typeof window !== 'undefined' && window.location) {
  gtag('event', 'page_view', {
    page_path: window.location.pathname,
    page_location: window.location.origin + window.location.pathname
  });
}
`,
        }}
      />
      <Script
        id="_next-ga"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        onLoad={() => {
          scriptLoaded.current = true;
        }}
      />
    </>
  );
}
