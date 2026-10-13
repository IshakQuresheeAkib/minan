"use client";

import type { AdminOrder } from "@/features/admin/types";
import { label, localDate } from "./types";

export function ActivityTimeline({ order }: { order: AdminOrder }) {
  const activities = order.activity ?? [];

  return (
    <section className="py-6">
      <h2 className="text-lg font-semibold">Activity and audit trail</h2>
      <div className="mt-4 space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-foreground/60">No activity logged yet.</p>
        ) : (
          activities.map((entry, index) => (
            <div
              key={`${entry.event}-${entry.created_at}-${index}`}
              className="rounded-lg border p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{label(entry.event)}</span>
                <span className="text-xs text-foreground/55">
                  {localDate(entry.created_at)}
                </span>
              </div>
              {entry.reason ? (
                <p className="mt-1 text-foreground/75">{entry.reason}</p>
              ) : null}
              {entry.admin_email ? (
                <p className="mt-1 text-xs text-foreground/50">
                  Admin: {entry.admin_email}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
