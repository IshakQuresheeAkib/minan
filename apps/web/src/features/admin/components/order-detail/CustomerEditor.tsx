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
import { Textarea } from "@/components/ui/textarea";
import { shippingAreaLabel } from "@/features/admin/lib/shippingArea";
import type { AdminOrder } from "@/features/admin/types";
import type { MutationRunner } from "./types";

const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone_number: z
    .string()
    .trim()
    .regex(/^(?:\+?88)?01[3-9]\d{8}$/, "Enter a valid Bangladesh phone number."),
  email: z.string().trim().email("Enter a valid email address."),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters.")
    .max(1000),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters.")
    .max(500),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export function CustomerEditor({
  order,
  run,
}: {
  order: AdminOrder;
  run: MutationRunner;
}) {
  const [editing, setEditing] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: order.name,
      phone_number: order.phone_number,
      email: order.email,
      address: order.address,
      reason: "",
    },
  });

  async function onSubmit(values: CustomerFormValues) {
    const success = await run("customer", "PATCH", {
      name: values.name,
      phone_number: values.phone_number,
      email: values.email,
      address: values.address,
      reason: values.reason,
    });
    if (success) {
      setEditing(false);
    }
  }

  const isEditable = ["new", "confirmed", "processing", "on_hold"].includes(
    order.status,
  );

  return (
    <section className="border-b pb-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Customer and delivery</h2>
        {isEditable ? (
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
        <Form {...form}>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Detailed Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
                      placeholder="Operational reason for updating customer details"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="sm:w-fit" type="submit">
              Save customer details
            </Button>
          </form>
        </Form>
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
