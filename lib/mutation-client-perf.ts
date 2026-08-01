"use server";

/**
 * Client-observed wall time for a mutation (includes network + action + refresh).
 * Logged in Runtime Logs alongside [mutation-perf].
 */
export async function logMutationClientPerf(input: {
  action: string;
  wallMs: number;
  clientRefresh?: boolean;
  redirected?: boolean;
  duplicateGuardHit?: boolean;
}) {
  if (process.env.MUTATION_PERF_LOG === "0") {
    return;
  }

  const wall = Math.round(input.wallMs);
  console.info(
    `[mutation-client-perf] action=${input.action} wall=${wall}` +
      (input.clientRefresh ? " clientRefresh=1" : " clientRefresh=0") +
      (input.redirected ? " redirect=1" : "") +
      (input.duplicateGuardHit ? " duplicateGuard=1" : ""),
  );
}
