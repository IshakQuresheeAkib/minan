"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { adminRoutes } from "@/constants/routes";
import { useAdminOrder } from "@/features/admin/hooks/useAdminOrders";
import { shippingAreaLabel } from "@/features/admin/lib/shippingArea";

function money(value: number): string {
  return `Tk ${value.toLocaleString("en-BD")}`;
}

export function OrderPrintView({
  id,
  kind,
}: {
  id: string;
  kind: "invoice" | "packing-slip";
}) {
  const { order, error, isLoading } = useAdminOrder(id);
  if (isLoading)
    return <div className="minan-skeleton h-[70dvh] rounded-lg border" />;
  if (error || !order)
    return (
      <p className="text-destructive" role="alert">
        Order could not be loaded.
      </p>
    );
  const invoice = kind === "invoice";
  return (
    <div className="mx-auto max-w-4xl bg-background print:max-w-none">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`${adminRoutes.orders}/${order._id}`}
          className="inline-flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to Order
        </Link>
        <Button
          leftIcon={<Printer className="size-4" />}
          onClick={() => window.print()}
        >
          Print
        </Button>
      </div>
      <article className="rounded-lg border bg-white p-8 text-neutral-950 print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-8 border-b pb-6">
          <div>
            <p className="text-xl font-bold">MINAN</p>
            <p className="mt-1 text-sm">Bangladesh fashion commerce</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-semibold">
              {invoice ? "Invoice" : "Packing slip"}
            </h1>
            <p className="mt-1 font-medium">{order.order_number}</p>
            <p className="text-sm">
              {new Date(order.createdAt).toLocaleString("en-BD")}
            </p>
          </div>
        </header>
        <section className="grid gap-6 border-b py-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Ship to
            </h2>
            <p className="mt-2 font-semibold">{order.name}</p>
            <p>{order.phone_number}</p>
            <p className="mt-1 whitespace-pre-wrap">{order.address}</p>
            <p className="my-2">
              Shipping area: {shippingAreaLabel(order.shipping_zone)}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Fulfillment
            </h2>
            <p className="mt-2">Status: {order.status.replaceAll("_", " ")}</p>
            <p>Courier: {order.courier_name ?? "Not assigned"}</p>
            <p>Tracking: {order.tracking_number ?? "Not assigned"}</p>
          </div>
        </section>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-3">Item</th>
              <th className="py-3">Variant</th>
              <th className="py-3 text-right">Qty</th>
              {invoice ? (
                <>
                  <th className="py-3 text-right">Unit</th>
                  <th className="py-3 text-right">Line total</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.line_id} className="border-b">
                <td className="py-3 font-medium">{line.name}</td>
                <td className="py-3">
                  {line.size} / {line.color}
                </td>
                <td className="py-3 text-right">{line.quantity}</td>
                {invoice ? (
                  <>
                    <td className="py-3 text-right">
                      {money(line.unit_price)}
                    </td>
                    <td className="py-3 text-right">
                      {money(
                        line.unit_price * line.quantity -
                          line.allocated_order_discount,
                      )}
                    </td>
                  </>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {invoice ? (
          <section className="ml-auto mt-6 max-w-sm">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{money(order.financials.merchandise_subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Order discount</dt>
                <dd>− {money(order.financials.order_discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery fee</dt>
                <dd>{money(order.financials.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <dt>Overall Order value</dt>
                <dd>{money(order.financials.overall_order_value)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery fee paid by bKash</dt>
                <dd>
                  {money(
                    order.delivery_fee_status === "paid"
                      ? order.financials.delivery_fee
                      : 0,
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs">
              The delivery fee is non-refundable. Merchandise refunds, when due,
              are recorded separately.
            </p>
          </section>
        ) : null}
      </article>
    </div>
  );
}
