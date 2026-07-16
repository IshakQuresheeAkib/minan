export type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  price: number;
  categorySlug: string;
  subcategorySlug?: string;
  sizes: string[];
  colors: string[];
  images: string[];
};

export const productSeeds: ProductSeed[] = [
  {
    name: "Floral Lace Elegance",
    slug: "floral-lace-elegance",
    description: "Bloom with elegance.",
    price: 1600,
    categorySlug: "women",
    sizes: ["S", "M", "L"],
    colors: ["Red", "Black"],
    images: ["https://picsum.photos/seed/floral-lace-elegance/600/800"],
  },
  {
    name: "Sleek Satin Glamour",
    slug: "sleek-satin-glamour",
    description: "Satin, sleek, glamorous.",
    price: 1200,
    categorySlug: "women",
    sizes: ["S", "M", "L"],
    colors: ["Gold", "Black"],
    images: ["https://picsum.photos/seed/sleek-satin-glamour/600/800"],
  },
  {
    name: "Premium Cotton Tee",
    slug: "premium-cotton-tee",
    description: "Everyday comfort, premium feel.",
    price: 950,
    categorySlug: "t-shirts",
    subcategorySlug: "round-neck-t-shirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black"],
    images: ["https://picsum.photos/seed/premium-cotton-tee/600/800"],
  },
  {
    name: "Oxford Shirt",
    slug: "oxford-shirt",
    description: "Sharp lines for work and weekend.",
    price: 1450,
    categorySlug: "shirts",
    subcategorySlug: "full-sleeve-shirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Blue"],
    images: ["https://picsum.photos/seed/oxford-shirt/600/800"],
  },
  {
    name: "Slim Fit Chinos",
    slug: "slim-fit-chinos",
    description: "Tailored fit with all-day stretch.",
    price: 1350,
    categorySlug: "pants",
    subcategorySlug: "twill-pant",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Beige", "Navy"],
    images: ["https://picsum.photos/seed/slim-fit-chinos/600/800"],
  },
  {
    name: "Classic Loafers",
    slug: "classic-loafers",
    description: "Polished leather for formal occasions.",
    price: 2200,
    categorySlug: "footwear",
    sizes: ["40", "41", "42", "43"],
    colors: ["Brown", "Black"],
    images: ["https://picsum.photos/seed/classic-loafers/600/800"],
  },
  {
    name: "Leather Belt",
    slug: "leather-belt",
    description: "Minimal buckle, durable full-grain leather.",
    price: 850,
    categorySlug: "accessories",
    subcategorySlug: "belt",
    sizes: ["S", "M", "L"],
    colors: ["Brown", "Black"],
    images: ["https://picsum.photos/seed/leather-belt/600/800"],
  },
  {
    name: "Canvas Sneakers",
    slug: "canvas-sneakers",
    description: "Lightweight everyday sneakers with cushioned sole.",
    price: 1800,
    categorySlug: "footwear",
    subcategorySlug: "sneakers",
    sizes: ["40", "41", "42", "43"],
    colors: ["White", "Navy"],
    images: ["https://picsum.photos/seed/canvas-sneakers/600/800"],
  },
  {
    name: "Linen Summer Shirt",
    slug: "linen-summer-shirt",
    description: "Breathable linen for hot Bangladesh summers.",
    price: 1250,
    categorySlug: "shirts",
    subcategorySlug: "half-sleeve-shirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Sky Blue"],
    images: ["https://picsum.photos/seed/linen-summer-shirt/600/800"],
  },
  {
    name: "High-Waist Palazzo",
    slug: "high-waist-palazzo",
    description: "Flowy silhouette with a comfortable high waist.",
    price: 1100,
    categorySlug: "women",
    sizes: ["S", "M", "L"],
    colors: ["Black", "Maroon"],
    images: ["https://picsum.photos/seed/high-waist-palazzo/600/800"],
  },
];
