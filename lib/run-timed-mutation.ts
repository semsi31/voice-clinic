"use client";

import { logMutationClientPerf } from "@/lib/mutation-client-perf";

type TimedMutationOptions = {
  action: string;
  clientRefresh?: boolean;
  redirected?: boolean;
  /** Return true when the pending guard blocked a duplicate submit. */
  wasDuplicate?: boolean;
};

type PerfSnapshot = {
  total?: number;
  auth?: number;
  db?: number;
  r2?: number;
  revalidate?: number;
  queries?: number;
};

function readPerf(result: unknown): PerfSnapshot | null {
  if (!result || typeof result !== "object") return null;
  const perf = (result as { _perf?: PerfSnapshot })._perf;
  return perf && typeof perf === "object" ? perf : null;
}

/**
 * Measures client-observed wall time around a mutation and logs it server-side.
 * Also mirrors server `_perf` to the browser console for production benches.
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
  let result: T | undefined;
  try {
    result = await fn();
    return result;
  } finally {
    const wallMs = performance.now() - startedAt;
    const perf = result === undefined ? null : readPerf(result);
    if (perf) {
      console.info(
        `[mutation-perf-bridge] action=${options.action} total=${perf.total ?? ""} auth=${perf.auth ?? ""} db=${perf.db ?? ""} r2=${perf.r2 ?? ""} revalidate=${perf.revalidate ?? ""} queries=${perf.queries ?? ""} wall=${Math.round(wallMs)} clientRefresh=${options.clientRefresh ? 1 : 0}`,
      );
    }
    void logMutationClientPerf({
      action: options.action,
      wallMs,
      clientRefresh: options.clientRefresh ?? false,
      redirected: options.redirected,
    });
  }
}
