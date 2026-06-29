export type PaginationInput = {
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
} {
  const pageRaw = query.page;
  const limitRaw = query.limit;

  const page =
    typeof pageRaw === "string" && !Number.isNaN(Number.parseInt(pageRaw, 10))
      ? Math.max(1, Number.parseInt(pageRaw, 10))
      : DEFAULT_PAGE;

  const limit =
    typeof limitRaw === "string" && !Number.isNaN(Number.parseInt(limitRaw, 10))
      ? Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(limitRaw, 10)))
      : DEFAULT_LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
