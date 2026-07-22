const DEFAULT_TIMEOUT_MS = 2500;

export type StorefrontCacheTag = "catalog" | "home-banners";

export async function revalidateStorefront(
  tags: readonly StorefrontCacheTag[] = ["catalog"],
): Promise<boolean> {
  const url = process.env.STOREFRONT_REVALIDATE_URL?.trim();
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET?.trim();

  if (!url || !secret) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ tags }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text();
      console.error(
        `Storefront revalidation failed (${response.status}): ${message}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Storefront revalidation failed:", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
