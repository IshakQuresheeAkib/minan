const DEFAULT_TIMEOUT_MS = 2500;

export async function revalidateStorefront(): Promise<void> {
  const url = process.env.STOREFRONT_REVALIDATE_URL?.trim();
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET?.trim();

  if (!url || !secret) {
    return;
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
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text();
      console.error(
        `Storefront revalidation failed (${response.status}): ${message}`,
      );
    }
  } catch (error) {
    console.error("Storefront revalidation failed:", error);
  } finally {
    clearTimeout(timeout);
  }
}
