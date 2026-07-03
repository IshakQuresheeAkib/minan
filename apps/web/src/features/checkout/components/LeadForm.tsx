"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitCheckoutLead } from "@/features/checkout/actions/checkout.actions";
import { leadInputSchema, type LeadInput } from "@/features/checkout/schemas/lead.schema";
import type { CartSnapshot } from "@/features/checkout/types";
import { ApiError } from "@/lib/api/client";

type LeadFormProps = {
  cartSnapshot: CartSnapshot;
  onSuccess: () => void;
};

export function LeadForm({ cartSnapshot, onSuccess }: LeadFormProps) {
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

  async function onSubmit(values: LeadInput) {
    try {
      await submitCheckoutLead({
        ...values,
        cart_snapshot: cartSnapshot,
      });
      toast.success("Checkout request submitted");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to submit checkout request.",
      );
    }
  }

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit(onSubmit)(event);
      }}
    >
      <label className="grid gap-2 text-sm font-medium">
        Name
        <Input
          aria-invalid={Boolean(form.formState.errors.name)}
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <span className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Phone Number
        <Input
          aria-invalid={Boolean(form.formState.errors.phone_number)}
          {...form.register("phone_number")}
        />
        {form.formState.errors.phone_number ? (
          <span className="text-xs text-destructive">
            {form.formState.errors.phone_number.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <Input
          type="email"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <span className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Address
        <Textarea
          className="min-h-28"
          aria-invalid={Boolean(form.formState.errors.address)}
          {...form.register("address")}
        />
        {form.formState.errors.address ? (
          <span className="text-xs text-destructive">
            {form.formState.errors.address.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Notes
        <Textarea
          className="min-h-24"
          aria-invalid={Boolean(form.formState.errors.notes)}
          {...form.register("notes")}
        />
        {form.formState.errors.notes ? (
          <span className="text-xs text-destructive">
            {form.formState.errors.notes.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        bKash Transaction ID
        {/* Payment gateway integration will replace manual bKash TX ID collection later. */}
        <Input
          aria-invalid={Boolean(form.formState.errors.bkash_txn_id)}
          {...form.register("bkash_txn_id")}
        />
        {form.formState.errors.bkash_txn_id ? (
          <span className="text-xs text-destructive">
            {form.formState.errors.bkash_txn_id.message}
          </span>
        ) : null}
      </label>
      <Button
        className="mt-2 h-11 w-full"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Submitting..." : "Submit Checkout"}
      </Button>
    </form>
  );
}
