"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { fetchOrderChanges } from "@/features/admin/actions/orders.actions";
import { useAuthStore } from "@/store/auth.store";
import { useOrdersNotificationsStore } from "@/store/orders-notifications.store";

const CURSOR_KEY = "minan:orders:cursor:v1";
const PREFERENCE_KEY = "minan:orders:notifications:v1";
const POLL_MS = 30_000;
const PREFERENCE_EVENT = "minan-orders-notification-preference";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, value); } catch { /* Alerts still work in-memory when storage is unavailable. */ }
}

function subscribePreference(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", callback);
  window.addEventListener(PREFERENCE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREFERENCE_EVENT, callback);
  };
}

function notificationPreferenceSnapshot(): "unsupported" | "enabled" | "disabled" {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return readStorage(PREFERENCE_KEY) === "enabled" && Notification.permission === "granted"
    ? "enabled"
    : "disabled";
}

type OrdersNotifications = {
  unreadCount: number;
  notificationsEnabled: boolean;
  notificationsSupported: boolean;
  enableNotifications: () => Promise<void>;
  markOrdersRead: () => void;
};

function useNotificationPreference(): "unsupported" | "enabled" | "disabled" {
  return useSyncExternalStore(
    subscribePreference,
    notificationPreferenceSnapshot,
    () => "unsupported",
  );
}

export function OrdersNotificationProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const addUnreadOrders = useOrdersNotificationsStore((state) => state.addUnreadOrders);
  const notificationPreference = useNotificationPreference();
  const notificationsSupported = notificationPreference !== "unsupported";

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    const controller = new AbortController();
    let timeoutId: number | null = null;
    let failures = 0;

    async function poll() {
      if (controller.signal.aborted) return;
      if (!navigator.onLine || document.visibilityState === "hidden") {
        timeoutId = window.setTimeout(() => void poll(), POLL_MS);
        return;
      }
      try {
        const cursor = readStorage(CURSOR_KEY) ?? undefined;
        const response = await fetchOrderChanges(token, cursor);
        failures = 0;
        if (response.cursor) writeStorage(CURSOR_KEY, response.cursor);
        if (response.data.length > 0) {
          addUnreadOrders(response.data.length);
          const latest = response.data[response.data.length - 1]!;
          toast.info(`${response.data.length} new ${response.data.length === 1 ? "Order" : "Orders"}`, {
            description: `Latest: ${latest.order_number}`,
          });
          if (notificationsSupported && readStorage(PREFERENCE_KEY) === "enabled" && Notification.permission === "granted") {
            try { new Notification("New MINAN Order", { body: `${latest.order_number} is ready for review.` }); } catch { /* Badge and toast remain available. */ }
          }
        }
      } catch {
        failures += 1;
      } finally {
        const backoff = [POLL_MS, 60_000, 120_000, 300_000][Math.min(failures, 3)]!;
        timeoutId = window.setTimeout(() => void poll(), backoff + Math.floor(Math.random() * 5_000));
      }
    }

    function refresh() {
      if (document.visibilityState === "visible" && navigator.onLine) void poll();
    }
    window.addEventListener("online", refresh, { signal: controller.signal });
    window.addEventListener("focus", refresh, { signal: controller.signal });
    document.addEventListener("visibilitychange", refresh, { signal: controller.signal });
    void poll();
    return () => {
      controller.abort();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [accessToken, addUnreadOrders, notificationsSupported]);

  return <>{children}</>;
}

export function useOrdersNotifications(): OrdersNotifications {
  const unreadCount = useOrdersNotificationsStore((state) => state.unreadCount);
  const markOrdersRead = useOrdersNotificationsStore((state) => state.markOrdersRead);
  const notificationPreference = useNotificationPreference();
  const notificationsSupported = notificationPreference !== "unsupported";
  const notificationsEnabled = notificationPreference === "enabled";

  async function enableNotifications(): Promise<void> {
    if (!notificationsSupported) {
      toast.error("Browser notifications are not supported here.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      writeStorage(PREFERENCE_KEY, "enabled");
      window.dispatchEvent(new Event(PREFERENCE_EVENT));
      toast.success("Browser notifications enabled");
    } else {
      writeStorage(PREFERENCE_KEY, "denied");
      window.dispatchEvent(new Event(PREFERENCE_EVENT));
      toast.info("Order badges and in-app alerts will remain active.");
    }
  }

  return {
    unreadCount,
    notificationsEnabled,
    notificationsSupported,
    enableNotifications,
    markOrdersRead,
  };
}
