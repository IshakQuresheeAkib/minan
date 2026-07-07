import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const CATALOG_TAG = "catalog";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.REVALIDATE_SECRET?.trim();
  const providedSecret = request.headers.get("x-revalidate-secret")?.trim();

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(CATALOG_TAG, { expire: 0 });

  return NextResponse.json({
    revalidated: true,
    tag: CATALOG_TAG,
  });
}
