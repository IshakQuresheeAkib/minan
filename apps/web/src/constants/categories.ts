export const productCategories = [
  "T-Shirts",
  "Shirts",
  "Pants",
  "Footwear",
  "Accessories",
  "Ladies' Bags",
] as const;

export type ProductCategory = (typeof productCategories)[number];
