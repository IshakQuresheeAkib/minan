"use client";

import { RotateCw, ShieldAlert, Lock } from "lucide-react";
import { useState, useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getOutstandingCod } from "@/features/admin/lib/orderFinancials";
import { getAllowedTransitions } from "@/features/admin/lib/orderTransitions";
import type { AdminOrder, OrderStatus } from "@/features/admin/types";
import { label, money, type MutationRunner } from "./types";

export function OrderUtility({
  order,
  run,
  recheck,
}: {
  order: AdminOrder;
  run: MutationRunner;
  recheck: () => Promise<void>;
}) {
  const transitionCheck = getAllowedTransitions(order);
  const defaultNextStatus = transitionCheck.transitions[0]?.status ?? order.status;

  const [nextStatus, setNextStatus] = useState<OrderStatus>(defaultNextStatus);
  const [reason, setReason] = useState("");
  const [courier, setCourier] = useState(order.courier_name ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [note, setNote] = useState("");
  const workflowSelectId = useId();

  const outstanding = getOutstandingCod(order.financials);
  const selectedTransition = transitionCheck.transitions.find(
    (t) => t.status === nextStatus,
  );

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
            <dd>
              {order.payment_method === "bkash_full"
                ? "bKash — full"
                : order.payment_method === "cod"
                  ? "COD"
                  : "Not selected"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Merchandise paid online</dt>
            <dd>{money(order.financials.merchandise_paid_online)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery fee paid</dt>
            <dd>
              {money(
                order.delivery_fee_status === "paid"
                  ? order.financials.delivery_fee
                  : 0,
              )}
            </dd>
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
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Workflow</h2>
          {transitionCheck.isLocked ? (
            <span className="inline-flex items-center gap-1 text-xs text-foreground/50">
              <Lock className="size-3" aria-hidden="true" />
              Locked
            </span>
          ) : null}
        </div>

        {transitionCheck.isLocked ? (
          <div className="mt-3 rounded-md border border-border/80 bg-foreground/5 p-3 text-xs text-foreground/70">
            <p className="font-medium text-foreground">
              Status: {label(order.status)}
            </p>
            <p className="mt-1">{transitionCheck.lockedReason}</p>
          </div>
        ) : (
          <>
            <label
              htmlFor={workflowSelectId}
              className="mt-3 block text-xs font-medium text-foreground/60"
            >
              Next workflow status
            </label>
            <select
              id={workflowSelectId}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={nextStatus}
              onChange={(event) =>
                setNextStatus(event.target.value as OrderStatus)
              }
            >
              {transitionCheck.transitions.map((item) => (
                <option
                  key={item.status}
                  value={item.status}
                  disabled={item.disabled}
                >
                  {item.label}
                  {item.disabled ? ` (${item.disabledReason})` : ""}
                </option>
              ))}
            </select>

            {selectedTransition?.disabled && selectedTransition.disabledReason ? (
              <div
                className="mt-2 flex items-start gap-1.5 text-xs text-destructive"
                role="alert"
              >
                <ShieldAlert className="size-3.5 shrink-0 translate-y-0.5" />
                <span>{selectedTransition.disabledReason}</span>
              </div>
            ) : null}

            <Input
              className="mt-3"
              placeholder={
                selectedTransition?.requiresReason
                  ? "Reason (required, min 3 characters)"
                  : "Reason / override reason"
              }
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />

            <Button
              className="mt-3 w-full"
              disabled={
                selectedTransition?.disabled ||
                (selectedTransition?.requiresReason && reason.trim().length < 3)
              }
              onClick={() => {
                const trimmedReason = reason.trim();
                void run("transitions", "POST", {
                  status: nextStatus,
                  reason: trimmedReason || undefined,
                  override_reason: selectedTransition?.requiresReason
                    ? trimmedReason || undefined
                    : trimmedReason.length >= 3
                      ? trimmedReason
                      : undefined,
                });
              }}
            >
              Update workflow
            </Button>
          </>
        )}
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
          disabled={!courier.trim() || !tracking.trim()}
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
          <div className="mt-3">
            <Button
              className="w-full"
              size="sm"
              onClick={() =>
                void run("cod", "POST", {
                  amount: outstanding,
                })
              }
            >
              Collect
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
