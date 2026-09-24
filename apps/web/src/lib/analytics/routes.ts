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
      setGa4Disabled(measurementId, !isAnalyticsAllowed(nextPathname));
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
    setGa4Disabled(measurementId, !isAnalyticsAllowed(window.location.pathname));
  };
  window.addEventListener("popstate", onPopState, true);

  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", onPopState, true);
  };
}
