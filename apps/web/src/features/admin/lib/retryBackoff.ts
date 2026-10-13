export const DEFAULT_BACKOFF_DELAYS = [
  30_000, 60_000, 120_000, 300_000,
] as const;

/**
 * Calculates exponential backoff with random jitter.
 * @param failureCount 0-indexed count of consecutive failures or retries
 * @param delays Array of delay milestones in milliseconds
 * @param maxJitter Maximum random jitter in milliseconds (default 5,000ms)
 * @returns Total delay in milliseconds
 */
export function calculateBackoffWithJitter(
  failureCount: number,
  delays: readonly number[] = DEFAULT_BACKOFF_DELAYS,
  maxJitter = 5_000,
): number {
  const index = Math.min(Math.max(0, failureCount), delays.length - 1);
  const baseDelay = delays[index] ?? 30_000;
  const jitter = Math.floor(Math.random() * maxJitter);
  return baseDelay + jitter;
}

/**
 * Standard SWR onErrorRetry handler with backoff and visibility/online awareness.
 */
export function swrRetryWithBackoff(
  _error: Error,
  _key: string,
  _config: { errorRetryCount?: number },
  revalidate: (options: { retryCount: number }) => void,
  options: { retryCount: number },
) {
  if (
    typeof window === "undefined" ||
    !navigator.onLine ||
    document.visibilityState === "hidden"
  ) {
    return;
  }
  const delay = calculateBackoffWithJitter(options.retryCount);
  window.setTimeout(
    () => revalidate({ retryCount: options.retryCount + 1 }),
    delay,
  );
}
