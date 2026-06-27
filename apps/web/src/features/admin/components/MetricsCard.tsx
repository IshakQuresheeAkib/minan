type MetricsCardProps = {
  label: string;
  value: string;
};

export function MetricsCard({ label, value }: MetricsCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
