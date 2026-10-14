"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AdminOrder } from "@/features/admin/types";
import { money, type MutationRunner } from "./types";

const itemsEditorSchema = z.object({
  quantities: z.record(
    z.string(),
    z.number().int().min(1, "Quantity must be at least 1"),
  ),
  discount: z.number().int().min(0, "Discount cannot be negative"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters"),
});

type ItemsEditorFormValues = z.infer<typeof itemsEditorSchema>;

export function ItemsEditor({
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
    "on_hold",
  ].includes(order.status);
  const [editing, setEditing] = useState(false);

  const initialQuantities = Object.fromEntries(
    order.lines.map((line) => [line.line_id, line.quantity]),
  );

  const form = useForm<ItemsEditorFormValues>({
    resolver: zodResolver(itemsEditorSchema),
    defaultValues: {
      quantities: initialQuantities,
      discount: order.financials.order_discount,
      reason: "",
    },
  });

  async function onSubmit(data: ItemsEditorFormValues) {
    const ok = await run("items", "PATCH", {
      items: order.lines.map((line) => ({
        line_id: line.line_id,
        product_id: line.product_id,
        size: line.size,
        color: line.color,
        quantity: data.quantities[line.line_id] ?? line.quantity,
      })),
      order_discount: data.discount,
      customer_confirmed: true,
      reason: data.reason,
    });
    if (ok) {
      setEditing(false);
    }
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                  <FormField
                    control={form.control}
                    name={`quantities.${line.line_id}`}
                    render={({ field }) => (
                      <div className="grid gap-1 text-xs">
                        <label
                          htmlFor={`qty-${line.line_id}`}
                          className="font-medium"
                        >
                          Quantity
                        </label>
                        <Input
                          id={`qty-${line.line_id}`}
                          className="w-20"
                          type="number"
                          min={Math.max(1, line.returned_quantity)}
                          value={field.value ?? line.quantity}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </div>
                    )}
                  />
                ) : (
                  <p className="font-semibold">× {line.quantity}</p>
                )}
              </div>
            ))}
          </div>

          {editing ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order discount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason and customer confirmation</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Reason for line/discount adjustment"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="sm:w-fit" type="submit">
                Save frozen Order
              </Button>
            </div>
          ) : null}
        </form>
      </Form>
    </section>
  );
}
