/**
 * Static path-cost analysis for panel mutations (before optimization baseline).
 * Counts round-trips / revalidates encoded in source — not wall-clock.
 *
 * Run: node scripts/measure-mutation-paths.mjs
 */

const baseline = [
  {
    name: "createPatientTransaction (+first payment)",
    authProfile: 1,
    supabaseQueries: "1 stock* + 1 insert tx + 1 insert pay + 2 receipt fetch + 1 doc insert + 1 pay update + 1 stock move + 1 reminder = ~9",
    r2: "1 upload (blocking PDF+R2)",
    revalidatePath: 7,
    redirectRefresh: "redirect only",
    serialIndependent: "sale/pay/stock/reminder serial; receipt re-fetches inserted rows",
    estimatedHotPathMs: "1200–3500 (PDF+R2 dominates)",
  },
  {
    name: "addTransactionPayment",
    authProfile: 1,
    supabaseQueries: "sale + payments total (serial) + insert + 2 receipt fetch + doc + update = ~7",
    r2: "1 upload (blocking)",
    revalidatePath: 6,
    redirectRefresh: "revalidate + router.refresh",
    serialIndependent: "saleAmount then paymentsTotal",
    estimatedHotPathMs: "1000–3000",
  },
  {
    name: "updateTransactionPaymentAction",
    authProfile: 1,
    supabaseQueries: "fetch + sale + total (serial) + update + recreate (~receipt create + old cleanup) = ~10+",
    r2: "1 upload + 1 delete (blocking)",
    revalidatePath: 6,
    redirectRefresh: "revalidate + router.refresh",
    serialIndependent: "sale then total; recreate serial",
    estimatedHotPathMs: "1500–4000",
  },
  {
    name: "deleteTransactionPaymentAction",
    authProfile: 1,
    supabaseQueries: "fetch + receipt cleanup (pay+doc+clear) + delete = ~5",
    r2: "1 delete (blocking, before DB delete)",
    revalidatePath: 6,
    redirectRefresh: "revalidate + router.refresh",
    serialIndependent: "n/a",
    estimatedHotPathMs: "400–1200",
  },
  {
    name: "deletePatientTransaction",
    authProfile: 1,
    supabaseQueries: "exists + N receipt cleanups serial + stock returns + delete",
    r2: "N deletes serial per payment",
    revalidatePath: 6,
    redirectRefresh: "revalidate + router.refresh",
    serialIndependent: "receipt cleanup vs stock reads could parallel",
    estimatedHotPathMs: "800–5000 (N receipts)",
  },
  {
    name: "createFinanceRecord / createReminder / createCargo",
    authProfile: 1,
    supabaseQueries: 1,
    r2: 0,
    revalidatePath: 1,
    redirectRefresh: "revalidate + router.refresh",
    serialIndependent: "none",
    estimatedHotPathMs: "150–600 (+ double refresh)",
  },
  {
    name: "createDocumentAction",
    authProfile: 1,
    supabaseQueries: 1,
    r2: "1 upload (blocking before DB)",
    revalidatePath: 1,
    redirectRefresh: "revalidate + router.refresh",
    serialIndependent: "n/a",
    estimatedHotPathMs: "400–2000 (file size)",
  },
  {
    name: "deleteDocumentAction",
    authProfile: 1,
    supabaseQueries: 2,
    r2: "1 delete BEFORE db (consistency risk)",
    revalidatePath: 1,
    redirectRefresh: "revalidate + router.refresh",
    serialIndependent: "n/a",
    estimatedHotPathMs: "300–1000",
  },
];

console.log("=== Panel mutation baseline (static) ===\n");
for (const row of baseline) {
  console.log(`## ${row.name}`);
  console.log(`  auth/profile: ${row.authProfile}`);
  console.log(`  supabase: ${row.supabaseQueries}`);
  console.log(`  R2: ${row.r2}`);
  console.log(`  revalidatePath: ${row.revalidatePath}`);
  console.log(`  redirect/refresh: ${row.redirectRefresh}`);
  console.log(`  serial independent: ${row.serialIndependent}`);
  console.log(`  est. hot path: ${row.estimatedHotPathMs}`);
  console.log("");
}

const slowest = [
  "updateTransactionPaymentAction",
  "createPatientTransaction (+first payment)",
  "addTransactionPayment",
  "deletePatientTransaction",
  "createDocumentAction",
];
console.log("Slowest 5 (baseline estimate):");
slowest.forEach((n, i) => console.log(`  ${i + 1}. ${n}`));
