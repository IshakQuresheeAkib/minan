export const productCategories = [
  "T-Shirts",
  "Shirts",
  "Pants",
  "Footwear",
  "Accessories",
  "Women",
] as const;

export type ProductCategory = (typeof productCategories)[number];
