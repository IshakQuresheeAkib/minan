export type CartSnapshotItem = {
  product_id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

export type CartSnapshot = {
  items: CartSnapshotItem[];
  total: number;
};

export type CheckoutLead = {
  _id: string;
};
