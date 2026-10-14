import type { AdminOrder, OrderStatus } from "@/features/admin/types";

export type AllowedTransitionOption = {
  status: OrderStatus;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  requiresReason?: boolean;
};

export type TransitionCheckResult = {
  isLocked: boolean;
  lockedReason?: string;
  transitions: AllowedTransitionOption[];
};

export function getAllowedTransitions(order: AdminOrder): TransitionCheckResult {
  const terminalStatuses: OrderStatus[] = ["cancelled", "returned", "exchanged"];
  if (terminalStatuses.includes(order.status)) {
    return {
      isLocked: true,
      lockedReason: `This order is in a terminal status (${order.status.replace("_", " ")}) and cannot transition.`,
      transitions: [],
    };
  }

  if (order.status === "delivered") {
    return {
      isLocked: true,
      lockedReason: "Order delivered. Returns and exchanges use the dedicated workflows below.",
      transitions: [],
    };
  }

  if (order.status === "on_hold") {
    const heldFrom = order.held_from_status;
    const transitions: AllowedTransitionOption[] = [];
    if (heldFrom) {
      transitions.push({
        status: heldFrom,
        label: `Resume to ${heldFrom.replace("_", " ")}`,
      });
    }
    transitions.push({
      status: "cancelled",
      label: "Cancel order",
      requiresReason: true,
    });
    return { isLocked: false, transitions };
  }

  if (order.status === "shipped") {
    return {
      isLocked: false,
      transitions: [
        {
          status: "delivered",
          label: "Mark delivered",
        },
      ],
    };
  }

  // Pre-shipment: new, confirmed, processing
  const transitions: AllowedTransitionOption[] = [];
  const feePaid = ["paid", "not_required"].includes(order.delivery_fee_status);

  if (order.status === "new") {
    transitions.push({
      status: "confirmed",
      label: "Confirm order",
      disabled: !feePaid,
      disabledReason: !feePaid ? "Delivery fee must be paid before confirmation" : undefined,
    });
    transitions.push({
      status: "processing",
      label: "Skip to processing (override)",
      requiresReason: true,
    });
    transitions.push({
      status: "on_hold",
      label: "Place on hold",
      requiresReason: true,
    });
    transitions.push({
      status: "cancelled",
      label: "Cancel order",
      requiresReason: true,
    });
  } else if (order.status === "confirmed") {
    transitions.push({
      status: "processing",
      label: "Start processing",
    });
    transitions.push({
      status: "new",
      label: "Revert to new (override)",
      requiresReason: true,
    });
    transitions.push({
      status: "on_hold",
      label: "Place on hold",
      requiresReason: true,
    });
    transitions.push({
      status: "cancelled",
      label: "Cancel order",
      requiresReason: true,
    });
  } else if (order.status === "processing") {
    const hasCourier = Boolean(order.courier_name && order.tracking_number);
    transitions.push({
      status: "shipped",
      label: "Mark shipped",
      disabled: !hasCourier,
      disabledReason: !hasCourier ? "Courier name and tracking number are required before shipping" : undefined,
    });
    transitions.push({
      status: "confirmed",
      label: "Revert to confirmed (override)",
      disabled: !feePaid,
      disabledReason: !feePaid ? "Delivery fee must be paid before confirmation" : undefined,
      requiresReason: true,
    });
    transitions.push({
      status: "new",
      label: "Revert to new (override)",
      requiresReason: true,
    });
    transitions.push({
      status: "on_hold",
      label: "Place on hold",
      requiresReason: true,
    });
    transitions.push({
      status: "cancelled",
      label: "Cancel order",
      requiresReason: true,
    });
  }

  return { isLocked: false, transitions };
}
