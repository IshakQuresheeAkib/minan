const SESSION_STORAGE_KEY = "minan_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export function getUtmParams(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
} {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
  };
}
