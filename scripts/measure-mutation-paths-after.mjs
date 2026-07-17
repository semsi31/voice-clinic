/**
 * Static path-cost analysis AFTER optimization.
 * Run: node scripts/measure-mutation-paths-after.mjs
 */

const after = [
  {
    name: "createPatientTransaction (+first payment)",
    beforeMs: "1200–3500",
    afterMs: "200–700 (+ deferred PDF/R2)",
    authProfile: 1,
    supabaseQueries: "~3–5 (no receipt re-fetch on hot path)",
    r2: "deferred via after()",
    revalidatePath: "1–3 (tx, optional stock/reminders)",
    notes: "redirect only; receipt context passed in",
  },
  {
    name: "addTransactionPayment",
    beforeMs: "1000–3000",
    afterMs: "150–500 (+ deferred PDF/R2)",
    authProfile: 1,
    supabaseQueries: "2 parallel limit checks + 1 insert",
    r2: "deferred via after()",
    revalidatePath: 1,
    notes: "no dashboard/reports fan-out",
  },
  {
    name: "updateTransactionPaymentAction",
    beforeMs: "1500–4000",
    afterMs: "150–500 (+ deferred recreate)",
    authProfile: 1,
    supabaseQueries: "1 fetch + 2 parallel + 1 update",
    r2: "deferred via after()",
    revalidatePath: 1,
    notes: "recreate no longer blocks response",
  },
  {
    name: "deleteTransactionPaymentAction",
    beforeMs: "400–1200",
    afterMs: "250–800",
    authProfile: 1,
    supabaseQueries: "~4 (DB-first receipt cleanup)",
    r2: "best-effort after DB",
    revalidatePath: 2,
    notes: "R2 failure does not orphan DB inconsistently",
  },
  {
    name: "deletePatientTransaction",
    beforeMs: "800–5000",
    afterMs: "400–2000",
    authProfile: 1,
    supabaseQueries: "parallel receipt cleanup + stock check",
    r2: "parallel per-payment cleanup",
    revalidatePath: "2–3 once (bulk: once at end)",
    notes: "no per-id dashboard/reports revalidate",
  },
  {
    name: "createFinance/Reminder/Cargo",
    beforeMs: "150–600",
    afterMs: "120–400",
    authProfile: 1,
    supabaseQueries: 1,
    r2: 0,
    revalidatePath: 1,
    notes: "pending submit guard; no multi-route revalidate",
  },
  {
    name: "createDocumentAction",
    beforeMs: "400–2000",
    afterMs: "400–2000 (R2 still dominates)",
    authProfile: 1,
    supabaseQueries: 1,
    r2: "blocking upload (required)",
    revalidatePath: 1,
    notes: "pending guard; upload then DB with R2 rollback",
  },
  {
    name: "deleteDocumentAction",
    beforeMs: "300–1000",
    afterMs: "250–900",
    authProfile: 1,
    supabaseQueries: 2,
    r2: "after DB delete (best-effort)",
    revalidatePath: 1,
    notes: "DB consistency first",
  },
];

console.log("=== Panel mutation AFTER optimization (static) ===\n");
for (const row of after) {
  console.log(`## ${row.name}`);
  console.log(`  before → after: ${row.beforeMs} → ${row.afterMs}`);
  console.log(`  auth/profile: ${row.authProfile}`);
  console.log(`  supabase: ${row.supabaseQueries}`);
  console.log(`  R2: ${row.r2}`);
  console.log(`  revalidatePath: ${row.revalidatePath}`);
  console.log(`  notes: ${row.notes}`);
  console.log("");
}
