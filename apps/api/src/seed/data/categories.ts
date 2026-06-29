export type CategorySeed = {
  name: string;
  slug: string;
  image_url: string;
};

export const categorySeeds: CategorySeed[] = [
  {
    name: "T-Shirts",
    slug: "t-shirts",
    image_url: "https://picsum.photos/seed/category-t-shirts/800/600",
  },
  {
    name: "Shirts",
    slug: "shirts",
    image_url: "https://picsum.photos/seed/category-shirts/800/600",
  },
  {
    name: "Pants",
    slug: "pants",
    image_url: "https://picsum.photos/seed/category-pants/800/600",
  },
  {
    name: "Footwear",
    slug: "footwear",
    image_url: "https://picsum.photos/seed/category-footwear/800/600",
  },
  {
    name: "Accessories",
    slug: "accessories",
    image_url: "https://picsum.photos/seed/category-accessories/800/600",
  },
  {
    name: "Women",
    slug: "women",
    image_url: "https://picsum.photos/seed/category-women/800/600",
  },
  {
    name: "Kids",
    slug: "kids",
    image_url: "https://picsum.photos/seed/category-kids/800/600",
  },
];
