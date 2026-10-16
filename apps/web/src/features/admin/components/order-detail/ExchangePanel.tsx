"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { fetchAdminProducts } from "@/features/admin/actions/products.actions";
import type { AdminOrder, AdminProduct } from "@/features/admin/types";
import { money, type MutationRunner } from "./types";

const exchangeSchema = z.object({
  returnedLine: z.string().min(1, "Select an item to return"),
  returnedQuantity: z
    .number()
    .int()
    .min(1, "Return quantity must be at least 1"),
  selectedProduct: z.string().min(1, "Select a replacement product"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  size: z.string().min(1, "Select size"),
  color: z.string().min(1, "Select color"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters"),
});

type ExchangeFormValues = z.infer<typeof exchangeSchema>;

export function ExchangePanel({
  order,
  run,
  accessToken,
}: {
  order: AdminOrder;
  run: MutationRunner;
  accessToken: string;
}) {
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const defaultReturnedLine = order.lines[0]?.line_id ?? "";

  const form = useForm<ExchangeFormValues>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: {
      returnedLine: defaultReturnedLine,
      returnedQuantity: 1,
      selectedProduct: "",
      quantity: 1,
      size: "",
      color: "",
      reason: "",
    },
  });

  const [selectedProductId, sizeValue, colorValue] = useWatch({
    control: form.control,
    name: ["selectedProduct", "size", "color"],
  });

  const selectedProduct = products.find(
    (product) => product._id === selectedProductId,
  );

  if (order.status !== "delivered") return null;

  async function loadProducts() {
    if (products.length) return;
    const response = await fetchAdminProducts(accessToken, {
      limit: 100,
      status: "active",
    });
    setProducts(response.data);
  }

  async function onSubmit(values: ExchangeFormValues) {
    const success = await run("exchanges", "POST", {
      returned_lines: [
        { line_id: values.returnedLine, quantity: values.returnedQuantity },
      ],
      replacement_items: [
        {
          product_id: values.selectedProduct,
          size: values.size,
          color: values.color,
          quantity: values.quantity,
        },
      ],
      reason: values.reason,
    });
    if (success) {
      form.reset();
    }
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
        <Form {...form}>
          <form
            className="mt-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="returnedLine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Returned line</FormLabel>
                  <FormControl>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      {...field}
                    >
                      {order.lines.map((line) => (
                        <option key={line.line_id} value={line.line_id}>
                          {line.name} ({line.size}/{line.color})
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="returnedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
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
              name="selectedProduct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Replacement product</FormLabel>
                  <FormControl>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        form.setValue("size", "");
                        form.setValue("color", "");
                      }}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} · {money(product.discounted_price)}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
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
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <FormControl>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      {...field}
                    >
                      <option value="">Select size</option>
                      {(selectedProduct?.sizes.length
                        ? selectedProduct.sizes
                        : ["N/A"]
                      ).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      {...field}
                    >
                      <option value="">Select color</option>
                      {(selectedProduct?.colors.length
                        ? selectedProduct.colors
                        : ["N/A"]
                      ).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Reason for customer exchange"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-foreground/60 sm:col-span-2">
              Replacement delivery is waived. A positive difference remains COD;
              cheaper exchanges leave a manual merchandise-refund balance.
            </p>
            <Button
              type="submit"
              disabled={!selectedProductId || !sizeValue || !colorValue}
            >
              Create linked exchange
            </Button>
          </form>
        </Form>
      </details>
    </section>
  );
}
