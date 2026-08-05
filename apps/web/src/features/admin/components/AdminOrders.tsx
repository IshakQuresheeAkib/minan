"use client";

import { Download, Filter, Search, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, startTransition, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminRoutes } from "@/constants/routes";
import { downloadAdminOrdersCsv } from "@/features/admin/actions/orders.actions";
import { useOrdersNotifications } from "@/features/admin/components/OrdersNotificationProvider";
import { TablePagination } from "@/features/admin/components/TablePagination";
import { getOutstandingCod } from "@/features/admin/lib/orderFinancials";
import { useAdminOrders } from "@/features/admin/hooks/useAdminOrders";
import type {
  AdminOrder,
  CodStatus,
  DeliveryFeeStatus,
  OrderStatus,
} from "@/features/admin/types";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

const PAGE_LIMIT = 20;
const workflowStatuses: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All workflows" },
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packing", label: "Packing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "on_hold", label: "On hold" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
  { value: "exchanged", label: "Exchanged" },
];
const feeStatuses: { value: DeliveryFeeStatus | ""; label: string }[] = [
  { value: "", label: "All fee states" },
  { value: "awaiting", label: "Awaiting fee" },
  { value: "processing", label: "Fee processing" },
  { value: "paid", label: "Fee paid" },
  { value: "failed", label: "Fee failed" },
  { value: "verification_pending", label: "Verification pending" },
  { value: "expired", label: "Fee expired" },
  { value: "not_required", label: "Fee not required" },
];
const codStatuses: { value: CodStatus | ""; label: string }[] = [
  { value: "", label: "All COD states" },
  { value: "due", label: "COD due" },
  { value: "collected", label: "COD collected" },
  { value: "waived", label: "COD waived" },
  { value: "partially_refunded", label: "Partially refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "not_required", label: "COD not required" },
];

function money(value: number): string {
  return `Tk ${value.toLocaleString("en-BD")}`;
}
function label(value: string): string {
  return value.replaceAll("_", " ");
}

function StatusBadge({
  value,
  kind,
}: {
  value: string;
  kind: "workflow" | "fee" | "cod";
}) {
  const destructive = ["cancelled", "returned", "failed", "expired"].includes(
    value,
  );
  return (
    <Badge
      variant={
        destructive
          ? "destructive"
          : value === "paid" || value === "delivered" || value === "collected"
            ? "default"
            : "secondary"
      }
    >
      {kind === "fee"
        ? `Fee: ${label(value)}`
        : kind === "cod"
          ? `COD: ${label(value)}`
          : label(value)}
    </Badge>
  );
}

type FilterFieldsProps = {
  search: string;
  status: string;
  fee: string;
  cod: string;
  duplicates: boolean;
  onSearch: (value: string) => void;
  onChange: (key: string, value: string) => void;
};

function OrdersFilterFields({
  search,
  status,
  fee,
  cod,
  duplicates,
  onSearch,
  onChange,
}: FilterFieldsProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(14rem,1fr)_repeat(4,auto)]">
      <label className="relative block">
        <span className="sr-only">Search Orders</span>
        <Search
          className="pointer-events-none absolute left-3 top-3 size-4 text-foreground/55"
          aria-hidden="true"
        />
        <Input
          className="pl-9"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Order, customer, phone, tracking"
        />
      </label>
      <select
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={status}
        onChange={(event) => onChange("status", event.target.value)}
        aria-label="Workflow status"
      >
        {workflowStatuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={fee}
        onChange={(event) => onChange("payment_status", event.target.value)}
        aria-label="Delivery fee status"
      >
        {feeStatuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={cod}
        onChange={(event) => onChange("cod_status", event.target.value)}
        aria-label="COD status"
      >
        {codStatuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <label className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm">
        <input
          type="checkbox"
          checked={duplicates}
          onChange={(event) =>
            onChange("duplicate_only", event.target.checked ? "true" : "")
          }
        />{" "}
        Duplicates
      </label>
    </div>
  );
}

function OrdersToolbar({ params }: { params: URLSearchParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);
  const { enableNotifications, notificationsEnabled, notificationsSupported } =
    useOrdersNotifications();
  const [search, setSearch] = useState(params.get("search") ?? "");

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    update("search", search.trim());
  }

  const fields = (
    <OrdersFilterFields
      search={search}
      status={params.get("status") ?? ""}
      fee={params.get("payment_status") ?? ""}
      cod={params.get("cod_status") ?? ""}
      duplicates={params.get("duplicate_only") === "true"}
      onSearch={setSearch}
      onChange={update}
    />
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form className="hidden flex-1 md:block" onSubmit={submit}>
          {fields}
        </form>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="md:hidden"
              variant="secondary"
              leftIcon={<Filter className="size-4" aria-hidden="true" />}
            >
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] overflow-y-auto p-5"
          >
            <SheetHeader>
              <SheetTitle>Filter Orders</SheetTitle>
            </SheetHeader>
            <form className="mt-5 space-y-4" onSubmit={submit}>
              {fields}
              <Button type="submit" className="h-11 w-full">
                Apply search
              </Button>
            </form>
          </SheetContent>
        </Sheet>
        {notificationsSupported && !notificationsEnabled ? (
          <Button
            variant="secondary"
            onClick={() => void enableNotifications()}
          >
            Enable notifications
          </Button>
        ) : null}
        <Button
          variant="secondary"
          leftIcon={<Download className="size-4" aria-hidden="true" />}
          disabled={!accessToken}
          onClick={() => {
            if (!accessToken) return;
            void downloadAdminOrdersCsv(accessToken, params).catch(
              (error: unknown) =>
                toast.error(
                  error instanceof ApiError ? error.message : "Export failed",
                ),
            );
          }}
        >
          Export CSV
        </Button>
      </div>
    </div>
  );
}

function OrdersDesktopTable({ orders }: { orders: AdminOrder[] }) {
  return (
    <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order / time</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>COD</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Workflow</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id}>
              <TableCell>
                <p className="font-semibold">{order.order_number}</p>
                <p className="mt-1 text-xs text-foreground/60">
                  {new Date(order.createdAt).toLocaleString("en-BD")}
                </p>
              </TableCell>
              <TableCell>
                <p className="font-medium">{order.name}</p>
                <a
                  className="text-xs text-foreground/65 hover:underline"
                  href={`tel:${order.phone_number}`}
                >
                  {order.phone_number}
                </a>
              </TableCell>
              <TableCell>
                <p>
                  {order.lines.reduce((sum, line) => sum + line.quantity, 0)}{" "}
                  units
                </p>
                <p className="max-w-52 truncate text-xs text-foreground/60">
                  {order.lines.map((line) => line.name).join(", ")}
                </p>
              </TableCell>
              <TableCell>
                <p className="font-medium">
                  {money(
                    order.cod_status === "waived"
                      ? 0
                      : Math.max(
                          order.financials.cod_due -
                            order.financials.cod_collected,
                          0,
                        ),
                  )}
                </p>
                <StatusBadge value={order.cod_status} kind="cod" />
              </TableCell>
              <TableCell>
                <StatusBadge value={order.delivery_fee_status} kind="fee" />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <StatusBadge value={order.status} kind="workflow" />
                  {order.duplicate_review_state === "pending" ? (
                    <Badge variant="destructive">
                      <TriangleAlert
                        className="mr-1 size-3"
                        aria-hidden="true"
                      />
                      Possible duplicate
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  href={`${adminRoutes.orders}/${order._id}`}
                  size="sm"
                  variant="secondary"
                >
                  View details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OrdersMobileCards({ orders }: { orders: AdminOrder[] }) {
  return (
    <div className="grid gap-3 md:hidden">
      {orders.map((order) => (
        <article
          key={order._id}
          className="rounded-lg border bg-background p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{order.order_number}</p>
              <p className="mt-1 text-xs text-foreground/60">
                {new Date(order.createdAt).toLocaleString("en-BD")}
              </p>
            </div>
            {order.duplicate_review_state === "pending" ? (
              <Badge variant="destructive">Duplicate?</Badge>
            ) : null}
          </div>
          <div className="mt-4">
            <p className="font-medium">{order.name}</p>
            <a
              className="text-sm text-foreground/65"
              href={`tel:${order.phone_number}`}
            >
              {order.phone_number}
            </a>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <StatusBadge value={order.status} kind="workflow" />
            <StatusBadge value={order.delivery_fee_status} kind="fee" />
            <StatusBadge value={order.cod_status} kind="cod" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
            <span>
              {order.lines.reduce((sum, line) => sum + line.quantity, 0)} units
            </span>
            <strong>
              {money(
                getOutstandingCod(order.financials, order.cod_status),
              )}{" "}
              COD
            </strong>
          </div>
          <Link
            href={`${adminRoutes.orders}/${order._id}`}
            className="mt-4 flex min-h-11 items-center justify-center rounded-md bg-secondary px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Open Order
          </Link>
        </article>
      ))}
    </div>
  );
}

export function AdminOrders() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { markOrdersRead } = useOrdersNotifications();
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", searchParams.get("page") ?? "1");
  params.set("limit", String(PAGE_LIMIT));
  const { data, error, loading, isValidating } = useAdminOrders(params);
  const page = Number(params.get("page"));
  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / (data?.limit ?? PAGE_LIMIT)),
  );
  useEffect(() => {
    markOrdersRead();
  }, [markOrdersRead]);
  function changePage(nextPage: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    router.push(`?${next.toString()}`);
  }
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Orders</h1>
          <p className="mt-1 text-sm text-foreground/65">
            Fulfillment, delivery-fee verification, COD, returns and exchanges
            in one queue.
          </p>
        </div>
        {isValidating && data ? (
          <p className="text-xs text-foreground/55" role="status">
            Refreshing…
          </p>
        ) : null}
      </div>
      <OrdersToolbar params={params} />
      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          Updates temporarily unavailable. Showing the last successful result.
        </p>
      ) : null}
      {loading ? (
        <div className="minan-skeleton h-72 rounded-lg border" />
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="font-semibold">No Orders match these filters</h2>
          <p className="mt-2 text-sm text-foreground/65">
            Clear filters or wait for a new checkout.
          </p>
        </div>
      ) : (
        <>
          <OrdersDesktopTable orders={data.data} />
          <OrdersMobileCards orders={data.data} />
        </>
      )}
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        limit={PAGE_LIMIT}
        disabled={loading}
        onPageChange={changePage}
      />
    </section>
  );
}
