export type SubcategorySeed = {
  categorySlug: string;
  name: string;
  slug: string;
  displayOrder: number;
};

export const subcategorySeeds: SubcategorySeed[] = [
  { categorySlug: "shirts", name: "Half Sleeve Shirt", slug: "half-sleeve-shirt", displayOrder: 0 },
  { categorySlug: "shirts", name: "Full Sleeve Shirt", slug: "full-sleeve-shirt", displayOrder: 1 },
  { categorySlug: "t-shirts", name: "Sando Genji", slug: "sando-genji", displayOrder: 0 },
  { categorySlug: "t-shirts", name: "Round Neck T-Shirt", slug: "round-neck-t-shirt", displayOrder: 1 },
  { categorySlug: "t-shirts", name: "Polo T-Shirt", slug: "polo-t-shirt", displayOrder: 2 },
  { categorySlug: "pants", name: "Jeans", slug: "jeans", displayOrder: 0 },
  { categorySlug: "pants", name: "Cargo", slug: "cargo", displayOrder: 1 },
  { categorySlug: "pants", name: "Twill Pant", slug: "twill-pant", displayOrder: 2 },
  { categorySlug: "pants", name: "Baggy", slug: "baggy", displayOrder: 3 },
  { categorySlug: "pants", name: "Formal Pant", slug: "formal-pant", displayOrder: 4 },
  { categorySlug: "pants", name: "Joggers", slug: "joggers", displayOrder: 5 },
  { categorySlug: "footwear", name: "Slipper", slug: "slipper", displayOrder: 0 },
  { categorySlug: "footwear", name: "Sandal", slug: "sandal", displayOrder: 1 },
  { categorySlug: "footwear", name: "Sneakers", slug: "sneakers", displayOrder: 2 },
  { categorySlug: "women", name: "Three Piece", slug: "three-piece", displayOrder: 0 },
  { categorySlug: "women", name: "Two Piece", slug: "two-piece", displayOrder: 1 },
  { categorySlug: "women", name: "Tops", slug: "tops", displayOrder: 2 },
  { categorySlug: "women", name: "Saree", slug: "saree", displayOrder: 3 },
  { categorySlug: "accessories", name: "Cap", slug: "cap", displayOrder: 0 },
  { categorySlug: "accessories", name: "Wallet", slug: "wallet", displayOrder: 1 },
  { categorySlug: "accessories", name: "Watch", slug: "watch", displayOrder: 2 },
  { categorySlug: "accessories", name: "Belt", slug: "belt", displayOrder: 3 },
];
