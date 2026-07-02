export const productCategories = [
  "Women",
  "Kids",
  "T-Shirts",
  "Shirts",
  "Pants",
  "Footwear",
  "Accessories",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export const categorySlugByName: Record<ProductCategory, string> = {
  "T-Shirts": "t-shirts",
  Shirts: "shirts",
  Pants: "pants",
  Footwear: "footwear",
  Accessories: "accessories",
  Women: "women",
  Kids: "kids",
};
