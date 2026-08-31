import type { PaymentMethod } from "../config/checkoutPayment.js";
import {
  shippingAreaLabel,
  type ShippingZone,
} from "../config/shipping.js";
import type {
  OrderDocument,
  OrderStatus,
} from "../models/Order.js";

type CustomerStageCopy = {
  label: string;
  helper_text_bn: string;
};

export type CustomerOrderTrackingDTO = {
  order_id: string;
  created_at: string;
  current_stage: CustomerStageCopy & {
    code: OrderStatus;
  };
  timeline: Array<CustomerStageCopy & {
    stage: OrderStatus;
    created_at: string;
    customer_note: string | null;
  }>;
  expected_delivery_date: string | null;
  courier: {
    name: string | null;
    tracking_code: string | null;
  };
  items: Array<{
    name: string;
    image_url: string | null;
    size: string;
    color: string;
    quantity: number;
  }>;
  shipping: {
    city: string | null;
    area: string;
  };
  payment_method_label: string | null;
  totals: {
    currency: "BDT";
    merchandise_subtotal: number;
    order_discount: number;
    merchandise_total: number;
    delivery_fee: number;
    overall_order_value: number;
  };
};

const stageCopy: Record<OrderStatus, CustomerStageCopy> = {
  new: {
    label: "Order placed",
    helper_text_bn: "আপনার অর্ডারটি গ্রহণ করা হয়েছে।",
  },
  confirmed: {
    label: "Confirmed",
    helper_text_bn: "আপনার অর্ডার নিশ্চিত করা হয়েছে।",
  },
  processing: {
    label: "Processing",
    helper_text_bn: "আপনার অর্ডার প্রস্তুত করা হচ্ছে।",
  },
  shipped: {
    label: "Shipped",
    helper_text_bn: "আপনার অর্ডার কুরিয়ারের কাছে দেওয়া হয়েছে।",
  },
  delivered: {
    label: "Delivered",
    helper_text_bn: "আপনার অর্ডার পৌঁছে দেওয়া হয়েছে।",
  },
  on_hold: {
    label: "On hold",
    helper_text_bn: "আপনার অর্ডারটি সাময়িকভাবে অপেক্ষমাণ আছে।",
  },
  cancelled: {
    label: "Cancelled",
    helper_text_bn: "আপনার অর্ডারটি বাতিল করা হয়েছে।",
  },
  returned: {
    label: "Returned",
    helper_text_bn: "আপনার অর্ডারের রিটার্ন আপডেট করা হয়েছে।",
  },
  exchanged: {
    label: "Exchanged",
    helper_text_bn: "আপনার অর্ডারের এক্সচেঞ্জ আপডেট করা হয়েছে।",
  },
};

type StatusActivityEvent = `status_${OrderStatus}`;

const statusActivityStage: Record<StatusActivityEvent, OrderStatus> = {
  status_new: "new",
  status_confirmed: "confirmed",
  status_processing: "processing",
  status_shipped: "shipped",
  status_delivered: "delivered",
  status_on_hold: "on_hold",
  status_cancelled: "cancelled",
  status_returned: "returned",
  status_exchanged: "exchanged",
};

const activityStage: Readonly<Record<string, OrderStatus>> = {
  order_created: "new",
  ...statusActivityStage,
  order_exchanged: "exchanged",
  exchange_order_created: "confirmed",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  bkash_full: "bKash full payment",
  cod: "Cash on Delivery (COD)",
};

const shippingCities: Record<ShippingZone, string | null> = {
  inside_sylhet: "Sylhet",
  outside_sylhet: null,
};

function paymentMethodLabel(paymentMethod?: PaymentMethod): string | null {
  return paymentMethod ? paymentMethodLabels[paymentMethod] : null;
}

function shippingCity(shippingZone?: ShippingZone): string | null {
  return shippingZone ? shippingCities[shippingZone] : null;
}

export function serializeCustomerOrder(order: OrderDocument): CustomerOrderTrackingDTO {
  const currentCopy = stageCopy[order.status];
  return {
    order_id: order.order_number,
    created_at: order.createdAt.toISOString(),
    current_stage: {
      code: order.status,
      ...currentCopy,
    },
    timeline: order.activity.flatMap((entry) => {
      const stage = activityStage[entry.event];
      if (!stage) return [];
      return [{
        stage,
        ...stageCopy[stage],
        created_at: entry.created_at.toISOString(),
        customer_note: entry.actor_type === "admin" ? entry.customer_note ?? null : null,
      }];
    }),
    expected_delivery_date: order.expected_delivery_date
      ? order.expected_delivery_date.toISOString().slice(0, 10)
      : null,
    courier: {
      name: order.courier_name ?? null,
      tracking_code: order.tracking_number ?? null,
    },
    items: order.lines.map((line) => ({
      name: line.name,
      image_url: line.image_url ?? null,
      size: line.size,
      color: line.color,
      quantity: line.quantity,
    })),
    shipping: {
      city: shippingCity(order.shipping_zone),
      area: shippingAreaLabel(order.shipping_zone),
    },
    payment_method_label: paymentMethodLabel(order.payment_method),
    totals: {
      currency: "BDT" as const,
      merchandise_subtotal: order.financials.merchandise_subtotal,
      order_discount: order.financials.order_discount,
      merchandise_total: order.financials.merchandise_total,
      delivery_fee: order.financials.delivery_fee,
      overall_order_value: order.financials.overall_order_value,
    },
  };
}
