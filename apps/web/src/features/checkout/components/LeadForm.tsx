"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
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
  disabled?: boolean;
  onSuccess: () => void;
};

export function LeadForm({
  cartSnapshot,
  disabled = false,
  onSuccess,
}: LeadFormProps) {
  const formId = useId();
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
  const errors = form.formState.errors;
  const errorIds = {
    address: `${formId}-address-error`,
    bkash_txn_id: `${formId}-bkash-txn-id-error`,
    email: `${formId}-email-error`,
    name: `${formId}-name-error`,
    notes: `${formId}-notes-error`,
    phone_number: `${formId}-phone-number-error`,
  };

  async function onSubmit(values: LeadInput) {
    try {
      const response = await submitCheckoutLead({
        ...values,
        cart_snapshot: cartSnapshot,
      });
      if (
        response.data.cart_snapshot &&
        response.data.cart_snapshot.total !== cartSnapshot.total
      ) {
        toast.info("Your order was updated with the latest product prices.");
      }
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
          aria-describedby={errors.name ? errorIds.name : undefined}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          {...form.register("name")}
        />
        {errors.name ? (
          <span id={errorIds.name} className="text-xs text-destructive" role="alert">
            {errors.name.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Phone Number
        <Input
          aria-describedby={
            errors.phone_number ? errorIds.phone_number : undefined
          }
          aria-invalid={Boolean(errors.phone_number)}
          autoComplete="tel"
          inputMode="tel"
          {...form.register("phone_number")}
        />
        {errors.phone_number ? (
          <span
            id={errorIds.phone_number}
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.phone_number.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <Input
          type="email"
          aria-describedby={errors.email ? errorIds.email : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          {...form.register("email")}
        />
        {errors.email ? (
          <span id={errorIds.email} className="text-xs text-destructive" role="alert">
            {errors.email.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Address
        <Textarea
          className="min-h-28"
          aria-describedby={errors.address ? errorIds.address : undefined}
          aria-invalid={Boolean(errors.address)}
          autoComplete="street-address"
          {...form.register("address")}
        />
        {errors.address ? (
          <span
            id={errorIds.address}
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.address.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Notes
        <Textarea
          className="min-h-24"
          aria-describedby={errors.notes ? errorIds.notes : undefined}
          aria-invalid={Boolean(errors.notes)}
          {...form.register("notes")}
        />
        {errors.notes ? (
          <span id={errorIds.notes} className="text-xs text-destructive" role="alert">
            {errors.notes.message}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        bKash Transaction ID
        {/* Payment gateway integration will replace manual bKash TX ID collection later. */}
        <Input
          aria-describedby={
            errors.bkash_txn_id ? errorIds.bkash_txn_id : undefined
          }
          aria-invalid={Boolean(errors.bkash_txn_id)}
          {...form.register("bkash_txn_id")}
        />
        {errors.bkash_txn_id ? (
          <span
            id={errorIds.bkash_txn_id}
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.bkash_txn_id.message}
          </span>
        ) : null}
      </label>
      <Button
        className="mt-2 h-11 w-full"
        type="submit"
        disabled={disabled || form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Submitting..." : "Submit Checkout"}
      </Button>
    </form>
  );
}
