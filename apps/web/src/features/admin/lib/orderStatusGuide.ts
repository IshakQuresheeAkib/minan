import type {
  CodStatus,
  DeliveryFeeStatus,
  OrderStatus,
} from "@/features/admin/types";

export type OrderStatusGuideEntry = {
  label: string;
  meaning: string;
  action: string;
  warning?: string;
};

export const WORKFLOW_STATUS_GUIDE = {
  new: {
    label: "New",
    meaning: "নতুন Order তৈরি হয়েছে, কিন্তু Confirm হয়নি।",
    action: "Customer details, items এবং Fee status দেখুন। Fee Paid বা Not required না হলে Confirm করবেন না।",
  },
  confirmed: {
    label: "Confirmed",
    meaning: "Order গ্রহণ এবং customer information যাচাই হয়েছে।",
    action: "Items প্রস্তুত করে Processing-এ নিন।",
  },
  processing: {
    label: "Processing",
    meaning: "Items fulfilment-এর জন্য প্রস্তুত হচ্ছে।",
    action: "Size, color ও quantity মিলিয়ে Courier এবং tracking প্রস্তুত করুন।",
    warning: "Payment processing বা Verification pending থাকলে again payment চাইবেন না।",
  },
  shipped: {
    label: "Shipped",
    meaning: "Order Courier-এর কাছে দেওয়া হয়েছে।",
    action: "Courier name ও tracking number মিলিয়ে বাস্তবে handover হওয়ার পরেই Shipped দিন।",
  },
  delivered: {
    label: "Delivered",
    meaning: "Customer Order পেয়েছেন।",
    action: "Return বা Exchange প্রয়োজন হলে এখান থেকে শুরু করুন।",
    warning: "টাকা হাতে পাওয়ার পরেই COD collection record করুন।",
  },
  on_hold: {
    label: "On hold",
    meaning: "Order সাময়িকভাবে থামানো হয়েছে।",
    action: "Hold reason সমাধান করে আগের workflow status-এ Resume করুন।",
    warning: "Hold ব্যবহার করে কোনো step skip করবেন না।",
  },
  cancelled: {
    label: "Cancelled",
    meaning: "Shipment-এর আগে Order বাতিল হয়েছে।",
    action: "কারণ যাচাই করে Cancel করুন। এটি terminal status এবং পুনরায় চালু করা যায় না।",
  },
  returned: {
    label: "Returned",
    meaning: "সব Order item return হিসেবে record হয়েছে।",
    action: "Refund আলাদাভাবে record হয়েছে কি না দেখুন।",
    warning: "Returned status নিজে থেকে Refund হয়েছে প্রমাণ করে না।",
  },
  exchanged: {
    label: "Exchanged",
    meaning: "Original Order exchange হয়ে replacement Order তৈরি হয়েছে।",
    action: "Original Order পরিবর্তন না করে linked replacement Order-এ কাজ করুন।",
    warning: "Financial review warning থাকলে financial split যাচাই করুন।",
  },
} satisfies Record<OrderStatus, OrderStatusGuideEntry>;

export const FEE_STATUS_GUIDE = {
  awaiting: {
    label: "Awaiting fee",
    meaning: "প্রয়োজনীয় bKash payment এখনো complete হয়নি।",
    action: "Payment-এর জন্য অপেক্ষা করুন; Order Confirm করবেন না।",
  },
  processing: {
    label: "Fee processing",
    meaning: "bKash payment attempt চলছে।",
    action: "ফলাফল না আসা পর্যন্ত অপেক্ষা করুন।",
    warning: "Dont ask for payment",
  },
  paid: {
    label: "Fee paid",
    meaning: "নির্ধারিত online payment settle হয়েছে।",
    action: "Payment method এবং COD status দেখুন।",
    warning: "COD Order-এ merchandise delivery-তে বাকি থাকতে পারে।",
  },
  failed: {
    label: "Fee failed",
    meaning: "Payment attempt ব্যর্থ বা cancelled হয়েছে; টাকা settle হয়নি।",
    action: "Customer-কে valid Retry ব্যবহার করতে বলুন এবং Paid হিসেবে ধরবেন না।",
  },
  verification_pending: {
    label: "Verification pending",
    meaning: "Gateway result নিশ্চিত নয়।",
    action: "Recheck bKash ব্যবহার করুন।",
    warning: "দ্বিতীয় payment বা manual collection করবেন না।",
  },
  expired: {
    label: "Fee expired",
    meaning: "Attempt সময়ের মধ্যে complete হয়নি।",
    action: "নতুন Retry প্রয়োজন; Expired attempt-কে Paid ধরবেন না।",
  },
  not_required: {
    label: "Fee not required",
    meaning: "এই category-তে online payment প্রয়োজন নেই।",
    action: "COD status আলাদা করে দেখুন।",
    warning: "Not required মানে পুরো Order paid নয়।",
  },
} satisfies Record<DeliveryFeeStatus, OrderStatusGuideEntry>;

export const COD_STATUS_GUIDE = {
  due: {
    label: "COD due",
    meaning: "Delivery-তে collect করার cod balance বাকি।",
    action: "COD outstanding দেখুন এবং বাস্তবে পাওয়া amount-ই record করুন।",
  },
  collected: {
    label: "COD collected",
    meaning: "সম্পূর্ণ COD amount collection হিসেবে record হয়েছে।",
    action: "আবার collection করবেন না; discrepancy হলে Financial split ও Activity দেখুন।",
  },
  partially_refunded: {
    label: "Partially refunded",
    meaning: "Record করা Refund, collected COD amount পুরোপুরি ফেরত দেয়নি।",
    action: "Refund amount, method, reference এবং remaining accounting দেখুন।",
    warning: "এটি physical Return workflow নয়।",
  },
  refunded: {
    label: "Refunded",
    meaning: "Collected COD amount সম্পূর্ণ Refund হিসেবে record হয়েছে।",
    action: "Refund record ও reference যাচাই করুন।",
    warning: "এটি physical Return workflow নয়।",
  },
  not_required: {
    label: "COD not required",
    meaning: "কোনো COD balance নেই।",
    action: "COD collect করবেন না; Fee status আলাদাভাবে দেখুন।",
  },
} satisfies Record<CodStatus, OrderStatusGuideEntry>;

export const WORKFLOW_STATUS_ORDER: readonly OrderStatus[] = [
  "new", "confirmed", "processing", "shipped", "delivered", "on_hold", "cancelled", "returned", "exchanged",
];
export const FEE_STATUS_ORDER: readonly DeliveryFeeStatus[] = [
  "awaiting", "processing", "paid", "failed", "verification_pending", "expired", "not_required",
];
export const COD_STATUS_ORDER: readonly CodStatus[] = [
  "due", "collected", "partially_refunded", "refunded", "not_required",
];

export const workflowStatusFilters = [
  { value: "", label: "All workflows" },
  ...WORKFLOW_STATUS_ORDER.map((value) => ({ value, label: WORKFLOW_STATUS_GUIDE[value].label })),
] as const;
export const feeStatusFilters = [
  { value: "", label: "All fee states" },
  ...FEE_STATUS_ORDER.map((value) => ({ value, label: FEE_STATUS_GUIDE[value].label })),
] as const;
export const codStatusFilters = [
  { value: "", label: "All COD states" },
  ...COD_STATUS_ORDER.map((value) => ({ value, label: COD_STATUS_GUIDE[value].label })),
] as const;
