import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const CATALOG_TAG = "catalog";
const HOME_BANNERS_TAG = "home-banners";
const ALLOWED_TAGS = new Set([CATALOG_TAG, HOME_BANNERS_TAG]);

type RevalidateRequestBody = {
  tags?: unknown;
};

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.REVALIDATE_SECRET?.trim();
  const providedSecret = request.headers.get("x-revalidate-secret")?.trim();

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RevalidateRequestBody = {};

  try {
    body = (await request.json()) as RevalidateRequestBody;
  } catch {
    // Preserve catalog-only behavior for callers without a JSON body.
  }

  const requestedTags = Array.isArray(body.tags)
    ? body.tags.filter(
        (tag): tag is string =>
          typeof tag === "string" && ALLOWED_TAGS.has(tag),
      )
    : [CATALOG_TAG];
  const tags = [...new Set(requestedTags)];

  if (tags.length === 0) {
    return NextResponse.json({ error: "No valid cache tags" }, { status: 400 });
  }

  tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));

  return NextResponse.json({
    revalidated: true,
    tags,
  });
}
