import { env } from "@/config/env";

const EXCLUDED_ANALYTICS_ROUTE_PREFIXES = [
  "/payment",
  "/account",
  "/admin",
] as const;

export function isAnalyticsAllowed(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }

  const normalized = pathname.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return !EXCLUDED_ANALYTICS_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

const PAYMENT_RESULT_READY_EVENT = "minan:ga4-payment-result-ready";
let completedPaymentResultReady = false;
let paymentResultVersion = 0;

export function isGa4Allowed(pathname: string | null | undefined): boolean {
  if (pathname?.trim().toLowerCase() === "/payment/result") {
    return (
      completedPaymentResultReady &&
      typeof window !== "undefined" &&
      window.location.search === ""
    );
  }
  return isAnalyticsAllowed(pathname);
}

export function onGa4PaymentResultReady(listener: () => void): () => void {
  window.addEventListener(PAYMENT_RESULT_READY_EVENT, listener);
  return () => window.removeEventListener(PAYMENT_RESULT_READY_EVENT, listener);
}

export function getGa4PaymentResultVersion(): number {
  return paymentResultVersion;
}

export function enableGa4ForCompletedPaymentResult(): void {
  if (
    typeof window === "undefined" ||
    window.location.pathname !== "/payment/result" ||
    window.location.search
  ) {
    return;
  }
  completedPaymentResultReady = true;
  paymentResultVersion += 1;
  setGa4Disabled(env.ga4Id.trim(), false);
  window.dispatchEvent(new Event(PAYMENT_RESULT_READY_EVENT));
}

export function setGa4Disabled(measurementId: string, disabled: boolean): void {
  if (typeof window === "undefined" || !measurementId) {
    return;
  }

  const globalScope = window as unknown as Record<string, boolean>;
  globalScope[`ga-disable-${measurementId}`] = disabled;
}

export function extractPathname(url: string | URL | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    if (typeof url === "string") {
      const parsed = new URL(url, "http://localhost");
      return parsed.pathname;
    }
    return url.pathname;
  } catch {
    return null;
  }
}

export function configureGa4RouteScoping(measurementId: string): () => void {
  if (typeof window === "undefined" || !measurementId) {
    return () => undefined;
  }

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  const handleUrlChange = (url: string | URL | null | undefined): void => {
    const nextPathname = extractPathname(url);
    if (nextPathname !== null) {
      const nextUrl = url ? new URL(url, window.location.origin) : null;
      if (nextPathname !== "/payment/result" || nextUrl?.search) {
        completedPaymentResultReady = false;
      }
      setGa4Disabled(measurementId, !isGa4Allowed(nextPathname));
    }
  };

  window.history.pushState = function (
    this: History,
    ...args: [data: unknown, unused: string, url?: string | URL | null]
  ): void {
    handleUrlChange(args[2]);
    return originalPushState.apply(this, args);
  };

  window.history.replaceState = function (
    this: History,
    ...args: [data: unknown, unused: string, url?: string | URL | null]
  ): void {
    handleUrlChange(args[2]);
    return originalReplaceState.apply(this, args);
  };

  const onPopState = (): void => {
    if (window.location.pathname !== "/payment/result" || window.location.search) {
      completedPaymentResultReady = false;
    }
    setGa4Disabled(measurementId, !isGa4Allowed(window.location.pathname));
  };
  window.addEventListener("popstate", onPopState, true);

  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", onPopState, true);
  };
}
