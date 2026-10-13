"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import type { AdminOrder } from "@/features/admin/types";
import type { MutationRunner } from "./types";

export function ReturnsRefunds({
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
