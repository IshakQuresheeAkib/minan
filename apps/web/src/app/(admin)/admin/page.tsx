export const metadata = {
  title: "Dashboard",
};

const metrics = [
  { label: "Today's Leads", value: "0" },
  { label: "This Month", value: "0" },
  { label: "Top Product", value: "Pending" },
  { label: "Traffic Source", value: "Pending" },
] as const;

export default function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Lead and traffic metrics from the Express API will land here.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
