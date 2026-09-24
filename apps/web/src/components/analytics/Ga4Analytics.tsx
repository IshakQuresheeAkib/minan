"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

import { env } from "@/config/env";
import { getGa4MeasurementId, markGa4Ready } from "@/lib/analytics/ga4";
import {
  configureGa4RouteScoping,
  getGa4PaymentResultVersion,
  isGa4Allowed,
  onGa4PaymentResultReady,
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
  const paymentResultVersion = useSyncExternalStore(
    onGa4PaymentResultReady,
    getGa4PaymentResultVersion,
    () => 0,
  );

  if (measurementId && typeof window !== "undefined") {
    setGa4Disabled(measurementId, !isGa4Allowed(pathname));
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

    const allowed = isGa4Allowed(pathname);
    setGa4Disabled(measurementId, !allowed);

    if (
      allowed &&
      pathname === "/payment/result" &&
      paymentResultVersion > 0 &&
      scriptLoaded.current
    ) {
      const gtag = getWindowGtag();
      if (gtag) {
        const referrer = document.referrer ? new URL(document.referrer) : null;
        gtag("event", "page_view", {
          page_path: pathname,
          page_location: window.location.origin + pathname,
          page_referrer: referrer ? referrer.origin + referrer.pathname : undefined,
        });
      }
    }
  }, [measurementId, pathname, paymentResultVersion]);

  if (!measurementId || !isGa4Allowed(pathname)) {
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
if (typeof window !== 'undefined' && window.location) {
  const referrer = document.referrer ? new URL(document.referrer) : null;
  gtag('config', '${measurementId}', {
    page_location: window.location.origin + window.location.pathname,
    page_referrer: referrer ? referrer.origin + referrer.pathname : undefined
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
          markGa4Ready();
        }}
      />
    </>
  );
}
