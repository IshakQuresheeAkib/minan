"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  recheckAdminLeadPayment,
  updateAdminLead,
} from "@/features/admin/actions/leads.actions";
import {
  adminLeadUpdateSchema,
  type AdminLeadUpdateInput,
} from "@/features/admin/schemas/admin.schemas";
import type { AdminLead } from "@/features/admin/types";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { ProductPrice } from "@/features/products/components/ProductPrice";

type LeadDetailDialogProps = {
  accessToken: string;
  lead: AdminLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

type LeadDetailFieldsProps = {
  accessToken: string;
  lead: AdminLead;
  onSaved: () => void;
  onClose: () => void;
};

function formatCurrency(value: number): string {
  return `Tk ${value.toLocaleString("en-BD")}`;
}

function LeadDetailFields({
  accessToken,
  lead,
  onSaved,
  onClose,
}: LeadDetailFieldsProps) {
  const form = useForm<AdminLeadUpdateInput>({
    resolver: zodResolver(adminLeadUpdateSchema),
    defaultValues: {
      delivery_status: lead.delivery_status,
      notes: lead.notes ?? "",
    },
  });

  async function onSubmit(values: AdminLeadUpdateInput) {
    try {
      await updateAdminLead(accessToken, lead._id, values);
      toast.success("Lead updated");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update lead",
      );
    }
  }

  return (
    <>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium">Phone</dt>
          <dd className="text-foreground/70">{lead.phone_number}</dd>
        </div>
        {lead.email ? (
          <div>
            <dt className="font-medium">Email</dt>
            <dd className="text-foreground/70">{lead.email}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-medium">Address</dt>
          <dd className="text-foreground/70">{lead.address}</dd>
        </div>
      </dl>

      {lead.cart_snapshot ? (
        <section className="mt-5 rounded-lg border bg-background/30 p-4">
          <h3 className="text-sm font-semibold">Order Items</h3>
          <div className="mt-3 grid gap-3">
            {lead.cart_snapshot.items.map((item) => (
              <div
                key={`${item.product_id}-${item.size}-${item.color}`}
                className="flex justify-between gap-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-xs text-foreground/70">
                    {item.size} / {item.color} x {item.quantity}
                  </p>
                </div>
                <ProductPrice
                  className="shrink-0 justify-end"
                  price={item.price * item.quantity}
                  originalPrice={item.original_price * item.quantity}
                  discount={item.discount}
                  size="sm"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>{formatCurrency(lead.cart_snapshot.total)}</span>
          </div>
        </section>
      ) : null}

      <section className="mt-5 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Payment attempts</h3>
          {lead.latest_payment_status === "verification_pending" ||
          lead.latest_payment_status === "initiated" ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                void recheckAdminLeadPayment(accessToken, lead._id)
                  .then(() => {
                    toast.success("Payment status rechecked");
                    onSaved();
                    onClose();
                  })
                  .catch((error: unknown) => {
                    toast.error(error instanceof ApiError ? error.message : "Failed to recheck payment");
                  });
              }}
            >
              Recheck
            </Button>
          ) : null}
        </div>
        {lead.legacy_bkash_txn_id ? (
          <div className="mt-3 border-l-2 border-amber-500 pl-3 text-sm">
            <p className="font-medium">Legacy transaction reference</p>
            <p className="mt-1 break-all text-xs">{lead.legacy_bkash_txn_id}</p>
            <p className="mt-1 text-xs text-foreground/65">
              Preserved from the manual checkout flow; not gateway-verified.
            </p>
          </div>
        ) : null}
        {lead.payment_attempts.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/65">No payment attempts recorded.</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {lead.payment_attempts.map((attempt) => (
              <div key={attempt._id} className="border-l-2 pl-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">Attempt {attempt.sequence}</span>
                  <span className="capitalize text-foreground/70">{attempt.status.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-1 break-all text-xs text-foreground/65">{attempt.merchant_invoice_number}</p>
                {attempt.bkash_trx_id ? <p className="mt-1 break-all text-xs">bKash transaction: {attempt.bkash_trx_id}</p> : null}
                {attempt.provider_status_message ? <p className="mt-1 text-xs text-foreground/65">{attempt.provider_status_message}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <Form {...form}>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            void form.handleSubmit(onSubmit)(event);
          }}
        >
          <FormField
            control={form.control}
            name="delivery_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="delivery_failed">Delivery failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Save changes</Button>
        </form>
      </Form>
    </>
  );
}

export function LeadDetailDialog({
  accessToken,
  lead,
  open,
  onOpenChange,
  onSaved,
}: LeadDetailDialogProps) {
  if (!lead) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead.name}</DialogTitle>
        </DialogHeader>

        {open ? (
          <LeadDetailFields
            key={lead._id}
            accessToken={accessToken}
            lead={lead}
            onSaved={onSaved}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
