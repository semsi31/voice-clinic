import "server-only";

type MutationTimerOptions = {
  name: string;
};

type TimedBucket = "auth" | "db" | "r2" | "revalidate";

/**
 * Request-scoped mutation timing for Runtime Logs.
 * On by default in production and development; set MUTATION_PERF_LOG=0 to disable.
 *
 * Format:
 * [mutation-perf] action=... total=... auth=... db=... r2=... revalidate=... queries=...
 */
export function createMutationTimer(options: MutationTimerOptions) {
  const enabled = process.env.MUTATION_PERF_LOG !== "0";
  const startedAt = performance.now();
  const marks: Record<string, number> = {};
  const buckets: Record<TimedBucket, number> = {
    auth: 0,
    db: 0,
    r2: 0,
    revalidate: 0,
  };
  let supabaseQueries = 0;
  let authProfileQueries = 0;
  let revalidateCount = 0;
  let clientRefresh = false;
  let redirectAfter = false;

  async function timeBucket<T>(
    bucket: TimedBucket,
    fn: () => Promise<T> | T,
  ): Promise<T> {
    if (!enabled) {
      return await fn();
    }

    const t0 = performance.now();
    try {
      return await fn();
    } finally {
      buckets[bucket] += performance.now() - t0;
    }
  }

  return {
    mark(label: string) {
      if (!enabled) return;
      marks[label] = Math.round(performance.now() - startedAt);
    },
    async timeAuth<T>(fn: () => Promise<T> | T): Promise<T> {
      authProfileQueries += 1;
      return timeBucket("auth", fn);
    },
    async timeDb<T>(fn: () => Promise<T> | T, queryCount = 1): Promise<T> {
      supabaseQueries += queryCount;
      return timeBucket("db", fn);
    },
    async timeR2<T>(fn: () => Promise<T> | T): Promise<T> {
      return timeBucket("r2", fn);
    },
    async timeRevalidate<T>(fn: () => Promise<T> | T, count = 1): Promise<T> {
      revalidateCount += count;
      return timeBucket("revalidate", fn);
    },
    /** @deprecated Prefer timeDb / count via timeDb queryCount */
    countSupabase(n = 1) {
      supabaseQueries += n;
    },
    /** @deprecated Prefer timeAuth */
    countAuthProfile(n = 1) {
      authProfileQueries += n;
    },
    addR2Ms(ms: number) {
      buckets.r2 += ms;
    },
    countRevalidate(n = 1) {
      revalidateCount += n;
    },
    setClientRefresh(value: boolean) {
      clientRefresh = value;
    },
    setRedirect(value: boolean) {
      redirectAfter = value;
    },
    snapshot() {
      return {
        total: Math.round(performance.now() - startedAt),
        auth: Math.round(buckets.auth),
        db: Math.round(buckets.db),
        r2: Math.round(buckets.r2),
        revalidate: Math.round(buckets.revalidate),
        queries: supabaseQueries,
        revalidateCount,
        authCalls: authProfileQueries,
      };
    },
    end(extra?: Record<string, unknown>) {
      if (!enabled) return;

      const snap = this.snapshot();

      console.info(
        `[mutation-perf] action=${options.name} total=${snap.total} auth=${snap.auth} db=${snap.db} r2=${snap.r2} revalidate=${snap.revalidate} queries=${snap.queries}` +
          (snap.revalidateCount ? ` revalidateCount=${snap.revalidateCount}` : "") +
          (clientRefresh ? ` clientRefresh=1` : "") +
          (redirectAfter ? ` redirect=1` : "") +
          (snap.authCalls ? ` authCalls=${snap.authCalls}` : ""),
      );

      if (extra && Object.keys(extra).length > 0) {
        console.info("[mutation-perf-extra]", {
          action: options.name,
          marks,
          ...extra,
        });
      }

      return snap;
    },
  };
}

export type MutationTimer = ReturnType<typeof createMutationTimer>;
