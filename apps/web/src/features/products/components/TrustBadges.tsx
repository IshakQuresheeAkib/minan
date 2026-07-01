import { Package, RefreshCw, Truck } from "lucide-react";

const trustItems = [
  {
    icon: Truck,
    label: "Free delivery Sylhet",
  },
  {
    icon: RefreshCw,
    label: "Easy exchange",
  },
  {
    icon: Package,
    label: "Premium quality",
  },
] as const;

export function TrustBadges() {
  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-3">
      {trustItems.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_8px_24px_rgba(151,72,34,0.04)]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </li>
      ))}
    </ul>
  );
}
