"use client";

import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  mutateAdminOrder,
  recheckAdminOrderPayment,
} from "@/features/admin/actions/orders.actions";
import { useAdminOrder } from "@/features/admin/hooks/useAdminOrders";
import { ApiError } from "@/lib/api/client";

import { ActivityTimeline } from "./order-detail/ActivityTimeline";
import { CustomerEditor } from "./order-detail/CustomerEditor";
import { ExchangePanel } from "./order-detail/ExchangePanel";
import { ItemsEditor } from "./order-detail/ItemsEditor";
import { OrderHeader } from "./order-detail/OrderHeader";
import { OrderUtility } from "./order-detail/OrderUtility";
import { ReturnsRefunds } from "./order-detail/ReturnsRefunds";

export function AdminOrderDetail({ id }: { id: string }) {
  const router = useRouter();
  const { order, accessToken, error, isLoading, mutate } = useAdminOrder(id);
  const [saving, setSaving] = useState(false);

  async function run(
    endpoint: string,
    method: "PATCH" | "POST",
    body: Record<string, unknown>,
  ): Promise<boolean> {
    if (!accessToken || !order) return false;
    setSaving(true);
    try {
      const response = await mutateAdminOrder(
        accessToken,
        order._id,
        endpoint,
        method,
        { ...body, expected_revision: order.revision },
      );
      await mutate({ data: response.data }, { revalidate: false });
      toast.success("Order updated");
      router.refresh();
      return true;
    } catch (mutationError) {
      toast.error(
        mutationError instanceof ApiError
          ? mutationError.message
          : "Order update failed",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function recheck() {
    if (!accessToken || !order) return;
    try {
      const response = await recheckAdminOrderPayment(accessToken, order._id);
      await mutate({ data: response.data }, { revalidate: false });
      toast.success("Payment status rechecked");
    } catch (recheckError) {
      toast.error(
        recheckError instanceof ApiError
          ? recheckError.message
          : "Recheck failed",
      );
    }
  }

  if (isLoading)
    return <div className="minan-skeleton h-[70dvh] rounded-lg border" />;

  if (error || !order || !accessToken)
    return (
      <p
        className="rounded-lg border border-destructive/30 p-5 text-destructive"
        role="alert"
      >
        {error instanceof Error ? error.message : "Order could not be loaded."}
      </p>
    );

  return (
    <div className={saving ? "pointer-events-none opacity-75" : ""}>
      <OrderHeader order={order} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main>
          <CustomerEditor
            key={`customer-${order.revision}`}
            order={order}
            run={run}
          />
          <ItemsEditor
            key={`items-${order.revision}`}
            order={order}
            run={run}
          />
          <ReturnsRefunds
            key={`returns-${order.revision}`}
            order={order}
            run={run}
          />
          <ExchangePanel
            key={`exchange-${order.revision}`}
            order={order}
            run={run}
            accessToken={accessToken}
          />
          <ActivityTimeline order={order} />
        </main>
        <OrderUtility
          key={`utility-${order.revision}`}
          order={order}
          run={run}
          recheck={recheck}
        />
      </div>
      <div className="sticky bottom-3 z-10 mt-4 lg:hidden">
        <a
          href={`tel:${order.phone_number}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold shadow-lg"
        >
          <Phone className="size-4" aria-hidden="true" />
          Call {order.name}
        </a>
      </div>
    </div>
  );
}
