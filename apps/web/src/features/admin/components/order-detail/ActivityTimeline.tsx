"use client";

import type { AdminOrder } from "@/features/admin/types";
import { label, localDate } from "./types";

export function ActivityTimeline({ order }: { order: AdminOrder }) {
  const entries = [...(order.activity ?? [])].reverse();

  return (
    <section className="py-6" aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="text-lg font-semibold text-foreground">
        Activity
      </h2>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/60">No activity logged yet.</p>
      ) : (
        <ol className="mt-4 border-l border-secondary pl-5">
          {entries.map((entry, index) => (
            <li
              key={`${entry.event}-${entry.created_at}-${index}`}
              className="relative pb-5 before:absolute before:-left-[1.5rem] before:top-1 before:size-2 before:rounded-full before:bg-primary before:content-['']"
            >
              <p className="text-sm font-semibold text-foreground">
                {label(entry.event)}
              </p>
              <p className="mt-1 text-xs text-foreground/55">
                {localDate(entry.created_at)} ·{" "}
                {entry.admin_email ?? entry.actor_type}
              </p>
              {entry.reason ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/75">
                  {entry.reason}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
