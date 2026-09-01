export type CustomerOrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "on_hold"
  | "cancelled"
  | "returned"
  | "exchanged";

export type CustomerOrderTracking = {
  order_id: string;
  created_at: string;
  current_stage: {
    code: CustomerOrderStatus;
    label: string;
    helper_text_bn: string;
  };
  timeline: Array<{
    stage: CustomerOrderStatus;
    label: string;
    helper_text_bn: string;
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

export type CustomerSession = {
  customer: {
    id: string;
    email: string;
    is_active: boolean;
  };
  accessToken: string;
};
