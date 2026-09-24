import { env } from "@/config/env";

type FbqFunction = {
  (command: "init", pixelId: string): void;
  (
    command: "track",
    eventName: string,
    params?: Record<string, unknown>,
    options?: { eventID?: string },
  ): void;
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  queue?: unknown[][];
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

function createPixelQueue(): FbqFunction {
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
      return;
    }

    fbq.queue?.push(args);
  }) as FbqFunction;

  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  return fbq;
}

export function initializeMetaPixel(pixelId: string): void {
  if (!pixelId || typeof window === "undefined") {
    return;
  }

  if (!window.fbq) {
    const fbq = createPixelQueue();
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    const firstScript = document.getElementsByTagName("script")[0];

    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  window.fbq("init", pixelId);
}

export function trackPixelEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  eventId?: string,
): void {
  if (
    !env.metaPixelId ||
    typeof window === "undefined" ||
    !window.fbq
  ) {
    return;
  }

  if (eventId) {
    window.fbq("track", eventName, params, { eventID: eventId });
    return;
  }

  window.fbq("track", eventName, params);
}

export function trackWhatsappLead(
  eventId: string,
  params: Record<string, unknown> = {},
): void {
  trackPixelEvent("Lead", params, eventId);
}

export function trackProductView(
  eventId: string,
  params: Record<string, unknown> = {},
): void {
  trackPixelEvent("ViewContent", params, eventId);
}
