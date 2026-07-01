import { env } from "@/config/env";

type FbqFunction = (
  command: "track",
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) => void;

declare global {
  interface Window {
    fbq?: FbqFunction;
  }
}

export function trackPixelEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  eventId?: string,
): void {
  if (!env.metaPixelId || typeof window === "undefined" || !window.fbq) {
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
