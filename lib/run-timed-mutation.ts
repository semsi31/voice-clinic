"use client";

import { logMutationClientPerf } from "@/lib/mutation-client-perf";

type TimedMutationOptions = {
  action: string;
  clientRefresh?: boolean;
  redirected?: boolean;
  /** Return true when the pending guard blocked a duplicate submit. */
  wasDuplicate?: boolean;
};

/**
 * Measures client-observed wall time around a mutation and logs it server-side.
 */
export async function runTimedMutation<T>(
  options: TimedMutationOptions,
  fn: () => Promise<T>,
): Promise<T> {
  if (options.wasDuplicate) {
    void logMutationClientPerf({
      action: options.action,
      wallMs: 0,
      duplicateGuardHit: true,
      clientRefresh: options.clientRefresh,
      redirected: options.redirected,
    });
    return undefined as T;
  }

  const startedAt = performance.now();
  try {
    return await fn();
  } finally {
    void logMutationClientPerf({
      action: options.action,
      wallMs: performance.now() - startedAt,
      clientRefresh: options.clientRefresh ?? false,
      redirected: options.redirected,
    });
  }
}
