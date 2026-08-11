"use client";

import { ArrowLeft, Phone, Printer, RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminRoutes } from "@/constants/routes";
import { fetchAdminProducts } from "@/features/admin/actions/products.actions";
import {
  mutateAdminOrder,
  recheckAdminOrderPayment,
} from "@/features/admin/actions/orders.actions";
import { useAdminOrder } from "@/features/admin/hooks/useAdminOrders";
import { shippingAreaLabel } from "@/features/admin/lib/shippingArea";
import type {
  AdminOrder,
  AdminProduct,
  OrderStatus,
} from "@/features/admin/types";
import { getOutstandingCod } from "@/features/admin/lib/orderFinancials";
import { ApiError } from "@/lib/api/client";

function money(value: number): string {
  return `Tk ${value.toLocaleString("en-BD")}`;
}
function label(value: string): string {
  return value.replaceAll("_", " ");
}
function localDate(value: string): string {
  return new Date(value).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type MutationRunner = (
  endpoint: string,
  method: "PATCH" | "POST",
  body: Record<string, unknown>,
) => Promise<boolean>;

function OrderHeader({ order }: { order: AdminOrder }) {
  return (
    <header className="space-y-4">
      <Link
        href={adminRoutes.orders}
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground/65 hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-normal">
              {order.order_number}
            </h1>
            <Badge>{label(order.status)}</Badge>
            {order.duplicate_review_state === "pending" ? (
              <Badge variant="destructive">Possible duplicate</Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-foreground/60">
            Created {localDate(order.createdAt)} · Revision {order.revision}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            href={`${adminRoutes.orders}/${order._id}/invoice`}
            variant="secondary"
            leftIcon={<Printer className="size-4" aria-hidden="true" />}
          >
            Invoice
          </Button>
          <Button
            href={`${adminRoutes.orders}/${order._id}/packing-slip`}
            variant="secondary"
          >
            Packing slip
          </Button>
        </div>
      </div>
    </header>
  );
}

function CustomerEditor({
  order,
  run,
}: {
  order: AdminOrder;
  run: MutationRunner;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(order.name);
  const [phone, setPhone] = useState(order.phone_number);
  const [email, setEmail] = useState(order.email);
  const [address, setAddress] = useState(order.address);
  const [reason, setReason] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      await run("customer", "PATCH", {
        name,
        phone_number: phone,
        email,
        address,
        reason,
      })
    )
      setEditing(false);
  }
  return (
    <section className="border-b pb-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Customer and delivery</h2>
        {["new", "confirmed", "processing", "packing", "on_hold"].includes(
          order.status,
        ) ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
        ) : null}
      </div>
      {editing ? (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => void submit(event)}
        >
          <label className="grid gap-1 text-sm font-medium">
            Name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Phone
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Email
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Detailed Address
            <Textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Reason
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={3}
            />
          </label>
          <Button className="sm:w-fit" type="submit">
            Save customer details
          </Button>
        </form>
      ) : (
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground/55">Name</dt>
            <dd className="mt-1 font-medium">{order.name}</dd>
          </div>
          <div>
            <dt className="text-foreground/55">Phone</dt>
            <dd className="mt-1">
              <a
                className="font-medium hover:underline"
                href={`tel:${order.phone_number}`}
              >
                {order.phone_number}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-foreground/55">Email</dt>
            <dd className="mt-1 break-all">{order.email}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-foreground/55">Address</dt>
            <dd className="mt-1 whitespace-pre-wrap">{order.address}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-foreground/55">Shipping area</dt>
            <dd className="mt-1 font-medium">
              {shippingAreaLabel(order.shipping_zone)}
            </dd>
          </div>
          {order.customer_notes ? (
            <div className="sm:col-span-2">
              <dt className="text-foreground/55">Customer note</dt>
              <dd className="mt-1 whitespace-pre-wrap">
                {order.customer_notes}
              </dd>
            </div>
          ) : null}
        </dl>
      )}
    </section>
  );
}

function ItemsEditor({
  order,
  run,
}: {
  order: AdminOrder;
  run: MutationRunner;
}) {
  const editable = [
    "new",
    "confirmed",
    "processing",
    "packing",
    "on_hold",
  ].includes(order.status);
  const [editing, setEditing] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      order.lines.map((line) => [line.line_id, line.quantity]),
    ),
  );
  const [discount, setDiscount] = useState(order.financials.order_discount);
  const [reason, setReason] = useState("");
  async function save() {
    const ok = await run("items", "PATCH", {
      items: order.lines.map((line) => ({
        line_id: line.line_id,
        product_id: line.product_id,
        size: line.size,
        color: line.color,
        quantity: quantities[line.line_id] ?? line.quantity,
      })),
      order_discount: discount,
      customer_confirmed: true,
      reason,
    });
    if (ok) setEditing(false);
  }
  return (
    <section className="border-b py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Merchandise</h2>
        {editable ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Cancel" : "Edit quantities"}
          </Button>
        ) : null}
      </div>
      <div className="mt-4 divide-y rounded-lg border">
        {order.lines.map((line) => (
          <div
            key={line.line_id}
            className="flex items-start justify-between gap-4 p-4"
          >
            <div>
              <p className="font-medium">{line.name}</p>
              <p className="mt-1 text-xs text-foreground/60">
                {line.size} / {line.color} · {money(line.unit_price)} each
              </p>
              {line.returned_quantity ? (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {line.returned_quantity} returned ·{" "}
                  {money(line.credited_amount)} credit
                </p>
              ) : null}
            </div>
            {editing ? (
              <label className="grid gap-1 text-xs">
                Quantity
                <Input
                  className="w-20"
                  type="number"
                  min={Math.max(1, line.returned_quantity)}
                  value={quantities[line.line_id]}
                  onChange={(event) =>
                    setQuantities((value) => ({
                      ...value,
                      [line.line_id]: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ) : (
              <p className="font-semibold">× {line.quantity}</p>
            )}
          </div>
        ))}
      </div>
      {editing ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            Order discount
            <Input
              type="number"
              min={0}
              value={discount}
              onChange={(event) => setDiscount(Number(event.target.value))}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Reason and customer confirmation
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </label>
          <Button className="sm:w-fit" onClick={() => void save()}>
            Save frozen Order
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ReturnsRefunds({
  order,
  run,
}: {
  order: AdminOrder;
  run: MutationRunner;
}) {
  const [returnQty, setReturnQty] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [refundReference, setRefundReference] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const eligible = order.status === "delivered" || order.status === "returned";
  return (
    <section className="border-b py-6">
      <h2 className="text-lg font-semibold">Returns and merchandise refunds</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Delivery fees never enter return credits or refund limits.
      </p>
      {eligible ? (
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <form
            className="space-y-3 rounded-lg border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const lines = order.lines.flatMap((line) =>
                returnQty[line.line_id]
                  ? [
                      {
                        line_id: line.line_id,
                        quantity: returnQty[line.line_id],
                      },
                    ]
                  : [],
              );
              void run("returns", "POST", { lines, reason: returnReason });
            }}
          >
            <h3 className="font-semibold">Record returned items</h3>
            {order.lines.map((line) => (
              <label
                key={line.line_id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>
                  {line.name} ({line.quantity - line.returned_quantity}{" "}
                  available)
                </span>
                <Input
                  className="w-20"
                  type="number"
                  min={0}
                  max={line.quantity - line.returned_quantity}
                  value={returnQty[line.line_id] ?? 0}
                  onChange={(event) =>
                    setReturnQty((value) => ({
                      ...value,
                      [line.line_id]: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ))}
            <Input
              placeholder="Return reason"
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
              required
            />
            <Button type="submit" variant="secondary">
              Record return
            </Button>
          </form>
          <form
            className="space-y-3 rounded-lg border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run("refunds", "POST", {
                amount: refundAmount,
                method: refundMethod,
                reference: refundReference || undefined,
                reason: refundReason,
              });
            }}
          >
            <h3 className="font-semibold">Record manual refund</h3>
            <Input
              type="number"
              min={1}
              value={refundAmount}
              onChange={(event) => setRefundAmount(Number(event.target.value))}
              aria-label="Refund amount"
            />
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={refundMethod}
              onChange={(event) => setRefundMethod(event.target.value)}
              aria-label="Refund method"
            >
              <option value="cash">Cash</option>
              <option value="bkash_manual">Manual bKash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="other">Other</option>
            </select>
            <Input
              placeholder="Reference (if applicable)"
              value={refundReference}
              onChange={(event) => setRefundReference(event.target.value)}
            />
            <Input
              placeholder="Refund reason"
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              required
            />
            <Button type="submit" variant="secondary">
              Record refund
            </Button>
          </form>
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-dashed p-4 text-sm text-foreground/60">
          Return tools unlock after delivery.
        </p>
      )}
    </section>
  );
}

function ExchangePanel({
  order,
  run,
  accessToken,
}: {
  order: AdminOrder;
  run: MutationRunner;
  accessToken: string;
}) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [returnedLine, setReturnedLine] = useState(
    order.lines[0]?.line_id ?? "",
  );
  const [returnedQuantity, setReturnedQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const selected = products.find((product) => product._id === selectedProduct);
  if (order.status !== "delivered") return null;
  async function loadProducts() {
    if (products.length) return;
    const response = await fetchAdminProducts(accessToken, {
      limit: 100,
      status: "active",
    });
    setProducts(response.data);
  }
  return (
    <section className="border-b py-6">
      <details
        onToggle={(event) => {
          if (event.currentTarget.open) void loadProducts();
        }}
      >
        <summary className="cursor-pointer text-lg font-semibold">
          Create exchange Order
        </summary>
        <form
          className="mt-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run("exchanges", "POST", {
              returned_lines: [
                { line_id: returnedLine, quantity: returnedQuantity },
              ],
              replacement_items: [
                { product_id: selectedProduct, size, color, quantity },
              ],
              reason,
            });
          }}
        >
          <label className="grid gap-1 text-sm font-medium">
            Returned line
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={returnedLine}
              onChange={(event) => setReturnedLine(event.target.value)}
            >
              {order.lines.map((line) => (
                <option key={line.line_id} value={line.line_id}>
                  {line.name} ({line.size}/{line.color})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Return quantity
            <Input
              type="number"
              min={1}
              value={returnedQuantity}
              onChange={(event) =>
                setReturnedQuantity(Number(event.target.value))
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Replacement product
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={selectedProduct}
              onChange={(event) => {
                setSelectedProduct(event.target.value);
                setSize("");
                setColor("");
              }}
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} · {money(product.discounted_price)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Quantity
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Size
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              required
            >
              <option value="">Select size</option>
              {(selected?.sizes.length ? selected.sizes : ["N/A"]).map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Color
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              required
            >
              <option value="">Select color</option>
              {(selected?.colors.length ? selected.colors : ["N/A"]).map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Reason
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </label>
          <p className="text-xs text-foreground/60 sm:col-span-2">
            Replacement delivery is waived. A positive difference remains COD;
            cheaper exchanges leave a manual merchandise-refund balance.
          </p>
          <Button type="submit" disabled={!selectedProduct || !size || !color}>
            Create linked exchange
          </Button>
        </form>
      </details>
    </section>
  );
}

function ActivityTimeline({ order }: { order: AdminOrder }) {
  const entries = [...(order.activity ?? [])].reverse();
  return (
    <section className="py-6">
      <h2 className="text-lg font-semibold">Activity</h2>
      <ol className="mt-4 border-l pl-5">
        {entries.map((entry, index) => (
          <li
            key={`${entry.created_at}-${index}`}
            className="relative pb-5 before:absolute before:-left-[1.5rem] before:top-1 before:size-2 before:rounded-full before:bg-primary"
          >
            <p className="text-sm font-semibold">{label(entry.event)}</p>
            <p className="mt-1 text-xs text-foreground/55">
              {localDate(entry.created_at)} ·{" "}
              {entry.admin_email ?? entry.actor_type}
            </p>
            {entry.reason ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/70">
                {entry.reason}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function OrderUtility({
  order,
  run,
  recheck,
}: {
  order: AdminOrder;
  run: MutationRunner;
  recheck: () => Promise<void>;
}) {
  const [nextStatus, setNextStatus] = useState<OrderStatus>(order.status);
  const [reason, setReason] = useState("");
  const [courier, setCourier] = useState(order.courier_name ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [note, setNote] = useState("");
  const outstanding = getOutstandingCod(order.financials, order.cod_status);
  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <section className="rounded-lg border bg-background p-5 shadow-sm">
        <h2 className="font-semibold">Financial split</h2>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt>Merchandise</dt>
            <dd>{money(order.financials.merchandise_total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Non-refundable fee</dt>
            <dd>{money(order.financials.delivery_fee)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <dt>Overall value</dt>
            <dd>{money(order.financials.overall_order_value)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Payment method</dt>
            <dd>{order.payment_method === "bkash_full" ? "bKash — full" : order.payment_method === "cod" ? "COD" : "Not selected"}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Merchandise paid online</dt>
            <dd>{money(order.financials.merchandise_paid_online)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery fee paid</dt>
            <dd>{money(order.delivery_fee_status === "paid" ? order.financials.delivery_fee : 0)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>COD outstanding</dt>
            <dd>{money(outstanding)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Merchandise refunded</dt>
            <dd>{money(order.financials.merchandise_refunded)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-1">
          <Badge>Fee: {label(order.delivery_fee_status)}</Badge>
          <Badge variant="secondary">COD: {label(order.cod_status)}</Badge>
        </div>
        {["initiated", "verification_pending"].includes(
          order.payment_attempts?.[0]?.status ?? "",
        ) ? (
          <Button
            className="mt-4 w-full"
            variant="secondary"
            leftIcon={<RotateCw className="size-4" aria-hidden="true" />}
            onClick={() => void recheck()}
          >
            Recheck bKash
          </Button>
        ) : null}
      </section>
      <section className="rounded-lg border bg-background p-5">
        <h2 className="font-semibold">Workflow</h2>
        <select
          className="mt-3 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
        >
          {[
            "new",
            "confirmed",
            "processing",
            "packing",
            "shipped",
            "delivered",
            "on_hold",
            "cancelled",
          ].map((value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </select>
        <Input
          className="mt-3"
          placeholder="Reason / override reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <Button
          className="mt-3 w-full"
          onClick={() =>
            void run("transitions", "POST", {
              status: nextStatus,
              reason: reason || undefined,
              override_reason: reason || undefined,
            })
          }
        >
          Update workflow
        </Button>
      </section>
      <section className="rounded-lg border bg-background p-5">
        <h2 className="font-semibold">Courier</h2>
        <Input
          className="mt-3"
          placeholder="Courier name"
          value={courier}
          onChange={(event) => setCourier(event.target.value)}
        />
        <Input
          className="mt-3"
          placeholder="Tracking number"
          value={tracking}
          onChange={(event) => setTracking(event.target.value)}
        />
        <Button
          className="mt-3 w-full"
          variant="secondary"
          onClick={() =>
            void run("courier", "PATCH", {
              courier_name: courier,
              tracking_number: tracking,
              reason: "Courier details updated",
            })
          }
        >
          Save courier
        </Button>
      </section>
      {outstanding > 0 ? (
        <section className="rounded-lg border bg-background p-5">
          <h2 className="font-semibold">COD</h2>
          <p className="mt-2 text-sm text-foreground/60">
            {money(outstanding)} outstanding
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={() =>
                void run("cod", "POST", {
                  action: "collect",
                  amount: outstanding,
                })
              }
            >
              Collect
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                void run("cod", "POST", {
                  action: "waive",
                  reason: "COD waived by administrator",
                })
              }
            >
              Waive
            </Button>
          </div>
        </section>
      ) : null}
      <section className="rounded-lg border bg-background p-5">
        <h2 className="font-semibold">Append note</h2>
        <Textarea
          className="mt-3"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Internal operational note"
        />
        <Button
          className="mt-3 w-full"
          variant="secondary"
          disabled={!note.trim()}
          onClick={() =>
            void run("notes", "POST", { note }).then((ok) => {
              if (ok) setNote("");
            })
          }
        >
          Add to activity
        </Button>
      </section>
      {order.duplicate_review_state === "pending" ? (
        <section className="rounded-lg border border-destructive/30 bg-background p-5">
          <h2 className="font-semibold">Duplicate review</h2>
          <div className="mt-3 grid gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                void run("duplicates", "PATCH", {
                  state: "reviewed_unique",
                  reason: "Reviewed as a unique Order",
                })
              }
            >
              Mark unique
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                void run("duplicates", "PATCH", {
                  state: "confirmed_duplicate",
                  reason: "Confirmed duplicate Order",
                })
              }
            >
              Confirm duplicate
            </Button>
          </div>
        </section>
      ) : null}
    </aside>
  );
}

export function AdminOrderDetail({ id }: { id: string }) {
  const router = useRouter();
  const { order, accessToken, error, isLoading, mutate } = useAdminOrder(id);
  const [saving, setSaving] = useState(false);
  async function run(
    endpoint: string,
    method: "PATCH" | "POST",
    body: Record<string, unknown>,
  ): Promise<boolean> {
    if (!accessToken || !order) return false;
    setSaving(true);
    try {
      const response = await mutateAdminOrder(
        accessToken,
        order._id,
        endpoint,
        method,
        { ...body, expected_revision: order.revision },
      );
      await mutate({ data: response.data }, { revalidate: false });
      toast.success("Order updated");
      router.refresh();
      return true;
    } catch (mutationError) {
      toast.error(
        mutationError instanceof ApiError
          ? mutationError.message
          : "Order update failed",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  async function recheck() {
    if (!accessToken || !order) return;
    try {
      const response = await recheckAdminOrderPayment(accessToken, order._id);
      await mutate({ data: response.data }, { revalidate: false });
      toast.success("Payment status rechecked");
    } catch (recheckError) {
      toast.error(
        recheckError instanceof ApiError
          ? recheckError.message
          : "Recheck failed",
      );
    }
  }
  if (isLoading)
    return <div className="minan-skeleton h-[70dvh] rounded-lg border" />;
  if (error || !order || !accessToken)
    return (
      <p
        className="rounded-lg border border-destructive/30 p-5 text-destructive"
        role="alert"
      >
        {error instanceof Error ? error.message : "Order could not be loaded."}
      </p>
    );
  return (
    <div className={saving ? "pointer-events-none opacity-75" : ""}>
      <OrderHeader order={order} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main>
          <CustomerEditor
            key={`customer-${order.revision}`}
            order={order}
            run={run}
          />
          <ItemsEditor
            key={`items-${order.revision}`}
            order={order}
            run={run}
          />
          <ReturnsRefunds
            key={`returns-${order.revision}`}
            order={order}
            run={run}
          />
          <ExchangePanel
            key={`exchange-${order.revision}`}
            order={order}
            run={run}
            accessToken={accessToken}
          />
          <ActivityTimeline order={order} />
        </main>
        <OrderUtility
          key={`utility-${order.revision}`}
          order={order}
          run={run}
          recheck={recheck}
        />
      </div>
      <div className="sticky bottom-3 z-10 mt-4 lg:hidden">
        <a
          href={`tel:${order.phone_number}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold shadow-lg"
        >
          <Phone className="size-4" aria-hidden="true" />
          Call {order.name}
        </a>
      </div>
    </div>
  );
}
