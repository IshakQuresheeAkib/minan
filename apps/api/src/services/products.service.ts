import type { PipelineStage, Types } from "mongoose";

import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Subcategory } from "../models/Subcategory.js";
import type {
  HomeCatalogResponse,
  ProductFilterOptionsResponse,
  ProductQuoteItemResponse,
} from "../types/product.types.js";
import { calculateDiscountedPrice } from "../utils/calculateDiscountedPrice.js";
import { serializeProduct } from "../utils/serializeProduct.js";

export type ProductSortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc";

export type ListProductsOptions = {
  categorySlugs?: string[];
  subcategorySlugs?: string[];
  search?: string;
  page?: number;
  limit?: number;
  excludeSlug?: string;
  colors?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSortOption;
};

type SearchCondition = {
  name?: { $regex: string; $options: "i" };
  description?: { $regex: string; $options: "i" };
  slug?: { $regex: string; $options: "i" };
};

type ProductFilter = {
  is_active: boolean;
  category_id?: Types.ObjectId | { $in: Types.ObjectId[] };
  subcategory_id?: Types.ObjectId | { $in: Types.ObjectId[] };
  slug?: { $ne: string };
  colors?: { $in: string[] };
  sizes?: { $in: string[] };
  $or?: SearchCondition[];
};

type ProductPageResult = {
  data: { _id: Types.ObjectId }[];
  metadata: { total: number }[];
};

type HomeProductGroupResult = {
  _id: Types.ObjectId;
  productIds: Types.ObjectId[];
  total: number;
};

const HOME_PRODUCTS_PER_CATEGORY = 7;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSort(
  sort: ProductSortOption | undefined,
): PipelineStage.Sort["$sort"] {
  if (sort === "price-asc") {
    return { effective_price: 1, _id: 1 };
  }

  if (sort === "price-desc") {
    return { effective_price: -1, _id: 1 };
  }

  if (sort === "name-asc") {
    return { name: 1, _id: 1 };
  }

  return { createdAt: -1, _id: -1 };
}

function getEffectivePriceExpression() {
  return {
    $cond: [
      { $eq: [{ $ifNull: ["$discount", 0] }, 0] },
      "$price",
      {
        $floor: {
          $add: [
            {
              $divide: [
                {
                  $multiply: [
                    "$price",
                    { $subtract: [100, { $ifNull: ["$discount", 0] }] },
                  ],
                },
                100,
              ],
            },
            0.5,
          ],
        },
      },
    ],
  };
}

export async function listProducts(options: ListProductsOptions = {}) {
  const filter: ProductFilter = { is_active: true };
  let selectedCategoryIds: Types.ObjectId[] | undefined;

  if (options.categorySlugs && options.categorySlugs.length > 0) {
    const categories = await Category.find({
      slug: { $in: options.categorySlugs },
      is_active: true,
    }).select("_id");

    if (categories.length === 0) {
      const page = Math.max(1, options.page ?? 1);
      const limit = Math.max(0, options.limit ?? 0);

      return { data: [], total: 0, page, limit, hasMore: false };
    }

    selectedCategoryIds = categories.map((category) => category._id);
    filter.category_id = { $in: selectedCategoryIds };
  }

  if (
    selectedCategoryIds &&
    options.subcategorySlugs &&
    options.subcategorySlugs.length > 0
  ) {
    const subcategories = await Subcategory.find({
      slug: { $in: options.subcategorySlugs },
      category_id: { $in: selectedCategoryIds },
      is_active: true,
    }).select("_id");

    const requestedSubcategoryCount = new Set(
      options.subcategorySlugs,
    ).size;
    if (subcategories.length !== requestedSubcategoryCount) {
      const page = Math.max(1, options.page ?? 1);
      const limit = Math.max(0, options.limit ?? 0);

      return { data: [], total: 0, page, limit, hasMore: false };
    }

    filter.subcategory_id = {
      $in: subcategories.map((subcategory) => subcategory._id),
    };
  }

  if (options.excludeSlug) {
    filter.slug = { $ne: options.excludeSlug };
  }

  if (options.colors && options.colors.length > 0) {
    filter.colors = { $in: options.colors };
  }

  if (options.sizes && options.sizes.length > 0) {
    filter.sizes = { $in: options.sizes };
  }

  const search = options.search?.trim();
  if (search) {
    const escapedSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
      { slug: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const page = Math.max(1, options.page ?? 1);
  const dataPipeline: PipelineStage.FacetPipelineStage[] = [];
  if (options.limit !== undefined) {
    dataPipeline.push({ $skip: (page - 1) * options.limit });
    dataPipeline.push({ $limit: options.limit });
  }
  dataPipeline.push({ $project: { _id: 1 } });

  const pipeline: PipelineStage[] = [
    { $match: filter },
    { $addFields: { effective_price: getEffectivePriceExpression() } },
  ];

  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    const effectivePriceFilter: { $gte?: number; $lte?: number } = {};

    if (options.minPrice !== undefined) {
      effectivePriceFilter.$gte = options.minPrice;
    }

    if (options.maxPrice !== undefined) {
      effectivePriceFilter.$lte = options.maxPrice;
    }

    pipeline.push({ $match: { effective_price: effectivePriceFilter } });
  }

  pipeline.push(
    { $sort: getSort(options.sort) },
    {
      $facet: {
        data: dataPipeline,
        metadata: [{ $count: "total" }],
      },
    },
  );

  const [pageResult] = await Product.aggregate<ProductPageResult>(pipeline);
  const productIds = pageResult?.data.map((item) => item._id) ?? [];
  const total = pageResult?.metadata[0]?.total ?? 0;
  const products = await Product.find({ _id: { $in: productIds } }).populate([
    "category_id",
    "subcategory_id",
  ]);
  const productById = new Map(
    products.map((product) => [product._id.toString(), product]),
  );
  const orderedProducts = productIds.flatMap((productId) => {
    const product = productById.get(productId.toString());
    return product ? [product] : [];
  });

  const limit = options.limit ?? total;

  return {
    data: orderedProducts.map(serializeProduct),
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

export async function getProductBySlug(slug: string) {
  return Product.findOne({ slug, is_active: true }).populate([
    "category_id",
    "subcategory_id",
  ]);
}

export async function getHomeCatalog(): Promise<HomeCatalogResponse> {
  const categories = await Category.find({ is_active: true })
    .sort({ name: 1 })
    .select("name slug image_url");

  if (categories.length === 0) {
    return { data: [] };
  }

  const groupedProducts = await Product.aggregate<HomeProductGroupResult>([
    {
      $match: {
        is_active: true,
        category_id: { $in: categories.map((category) => category._id) },
      },
    },
    { $sort: { category_id: 1, createdAt: -1, _id: -1 } },
    {
      $group: {
        _id: "$category_id",
        productIds: { $push: "$_id" },
        total: { $sum: 1 },
      },
    },
    {
      $project: {
        productIds: {
          $slice: ["$productIds", HOME_PRODUCTS_PER_CATEGORY],
        },
        total: 1,
      },
    },
  ]);
  const groupByCategoryId = new Map(
    groupedProducts.map((group) => [group._id.toString(), group]),
  );
  const productIds = groupedProducts.flatMap((group) => group.productIds);
  const products =
    productIds.length > 0
      ? await Product.find({ _id: { $in: productIds } }).populate([
          "category_id",
          "subcategory_id",
        ])
      : [];
  const productById = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  return {
    data: categories.map((category) => {
      const group = groupByCategoryId.get(category._id.toString());
      const total = group?.total ?? 0;
      const orderedProducts =
        group?.productIds.flatMap((productId) => {
          const product = productById.get(productId.toString());
          return product ? [product] : [];
        }) ?? [];

      return {
        category: {
          name: category.name,
          slug: category.slug,
          image_url: category.image_url,
        },
        products: {
          data: orderedProducts.map(serializeProduct),
          total,
          page: 1,
          limit: HOME_PRODUCTS_PER_CATEGORY,
          hasMore: total > HOME_PRODUCTS_PER_CATEGORY,
        },
      };
    }),
  };
}

export async function quoteProducts(
  productIds: string[],
): Promise<ProductQuoteItemResponse[]> {
  const uniqueProductIds = [...new Set(productIds)];
  const products = await Product.find({
    _id: { $in: uniqueProductIds },
    is_active: true,
  }).select("_id price discount");
  const productById = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  return uniqueProductIds.map((productId) => {
    const product = productById.get(productId);

    if (!product) {
      return { product_id: productId, is_available: false };
    }

    const discount = product.discount ?? 0;
    return {
      product_id: productId,
      is_available: true,
      price: product.price,
      discount,
      discounted_price: calculateDiscountedPrice(product.price, discount),
    };
  });
}

export async function getProductFilterOptions(): Promise<ProductFilterOptionsResponse> {
  const [
    referencedCategoryIds,
    referencedSubcategoryIds,
    colors,
    sizes,
    priceRange,
  ] = await Promise.all([
    Product.distinct("category_id", { is_active: true }),
    Product.distinct("subcategory_id", {
      is_active: true,
      subcategory_id: { $ne: null },
    }),
    Product.distinct("colors", { is_active: true }),
    Product.distinct("sizes", { is_active: true }),
    Product.aggregate<{ min: number; max: number }>([
      { $match: { is_active: true } },
      { $addFields: { effective_price: getEffectivePriceExpression() } },
      {
        $group: {
          _id: null,
          min: { $min: "$effective_price" },
          max: { $max: "$effective_price" },
        },
      },
    ]),
  ]);

  const categories = await Category.find({
    _id: { $in: referencedCategoryIds },
    is_active: true,
  })
    .sort({ name: 1 })
    .select("name slug image_url");

  const subcategories = await Subcategory.find({
    _id: { $in: referencedSubcategoryIds },
    category_id: { $in: categories.map((category) => category._id) },
    is_active: true,
  })
    .sort({ display_order: 1, name: 1 })
    .select("category_id name slug");
  const subcategoriesByCategoryId = new Map<
    string,
    { name: string; slug: string }[]
  >();

  subcategories.forEach((subcategory) => {
    const categoryId = String(subcategory.category_id);
    const current = subcategoriesByCategoryId.get(categoryId) ?? [];
    current.push({ name: subcategory.name, slug: subcategory.slug });
    subcategoriesByCategoryId.set(categoryId, current);
  });

  const price = priceRange[0] ?? { min: 0, max: 0 };

  return {
    data: {
      categories: categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        image_url: category.image_url,
        subcategories:
          subcategoriesByCategoryId.get(category._id.toString()) ?? [],
      })),
      colors: colors.sort((first, second) => first.localeCompare(second)),
      sizes: sizes.sort((first, second) => first.localeCompare(second)),
      price: {
        min: price.min,
        max: price.max,
      },
    },
  };
}
