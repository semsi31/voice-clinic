import "server-only";

type MutationTimerOptions = {
  name: string;
};

/**
 * Lightweight request-scoped mutation timing for Runtime Logs.
 * Enable with MUTATION_PERF_LOG=1 (always on in development).
 */
export function createMutationTimer(options: MutationTimerOptions) {
  const enabled =
    process.env.MUTATION_PERF_LOG === "1" ||
    process.env.NODE_ENV === "development";
  const startedAt = performance.now();
  const marks: Record<string, number> = {};
  let supabaseQueries = 0;
  let authProfileQueries = 0;
  let r2Ms = 0;
  let revalidateCount = 0;

  return {
    mark(label: string) {
      if (!enabled) return;
      marks[label] = Math.round(performance.now() - startedAt);
    },
    countSupabase(n = 1) {
      supabaseQueries += n;
    },
    countAuthProfile(n = 1) {
      authProfileQueries += n;
    },
    addR2Ms(ms: number) {
      r2Ms += ms;
    },
    countRevalidate(n = 1) {
      revalidateCount += n;
    },
    end(extra?: Record<string, unknown>) {
      if (!enabled) return;
      console.info("[mutation-perf]", {
        name: options.name,
        totalMs: Math.round(performance.now() - startedAt),
        supabaseQueries,
        authProfileQueries,
        r2Ms: Math.round(r2Ms),
        revalidateCount,
        marks,
        ...extra,
      });
    },
  };
}

export type MutationTimer = ReturnType<typeof createMutationTimer>;
