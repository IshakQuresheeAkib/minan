import type { DashboardMetrics } from "@/features/admin/types";

type TrafficPanelProps = {
  trafficSources: DashboardMetrics["trafficSources"];
};

export function TrafficPanel({ trafficSources }: TrafficPanelProps) {
  return (
    <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold tracking-normal">Traffic Sources</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        UTM breakdown from analytics events.
      </p>

      {trafficSources.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No traffic data yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y">
          {trafficSources.map((entry) => (
            <li
              key={entry.source}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span className="font-medium">{entry.source}</span>
              <span className="text-muted-foreground">{entry.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
