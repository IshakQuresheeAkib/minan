"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { leadInputSchema, type LeadInput } from "@/features/checkout/schemas/lead.schema";

export function LeadForm() {
  const form = useForm<LeadInput>({
    resolver: zodResolver(leadInputSchema),
    defaultValues: {
      name: "",
      phone_number: "",
      email: "",
      address: "",
      notes: "",
      bkash_txn_id: "",
    },
  });

  function onSubmit(values: LeadInput) {
    console.info("Lead form submitted", values);
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <label className="grid gap-2 text-sm font-medium">
        Name
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          {...form.register("name")}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Phone Number
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          {...form.register("phone_number")}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          type="email"
          {...form.register("email")}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Address
        <textarea
          className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          {...form.register("address")}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Notes
        <textarea
          className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          {...form.register("notes")}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        bKash Transaction ID
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          {...form.register("bkash_txn_id")}
        />
      </label>
      <Button className="mt-2 w-fit" type="submit">
        Submit Lead
      </Button>
    </form>
  );
}
