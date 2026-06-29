export const productCategories = [
  "T-Shirts",
  "Shirts",
  "Pants",
  "Footwear",
  "Accessories",
  "Women",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export const categorySlugByName: Record<ProductCategory, string> = {
  "T-Shirts": "t-shirts",
  Shirts: "shirts",
  Pants: "pants",
  Footwear: "footwear",
  Accessories: "accessories",
  Women: "women",
};
