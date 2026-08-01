/**
 * Measures production Supabase/R2 hot paths used by the 5 critical panel mutations.
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, anon key, and either:
 *   MEASURE_EMAIL + MEASURE_PASSWORD (panel user), or existing session is not supported.
 *
 * Usage: node --env-file=.env.local scripts/measure-prod-mutation-hotpaths.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { performance } from "node:perf_hooks";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.MEASURE_EMAIL;
const password = process.env.MEASURE_PASSWORD;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

if (!email || !password) {
  console.error("Set MEASURE_EMAIL and MEASURE_PASSWORD for a real panel user.");
  process.exit(1);
}

async function timed(label, fn) {
  const t0 = performance.now();
  const result = await fn();
  const ms = Math.round(performance.now() - t0);
  return { label, ms, result };
}

async function main() {
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const authSignIn = await timed("auth.signIn", () =>
    supabase.auth.signInWithPassword({ email, password }),
  );
  if (authSignIn.result.error || !authSignIn.result.data.user) {
    console.error("Sign-in failed", authSignIn.result.error);
    process.exit(1);
  }

  const userId = authSignIn.result.data.user.id;

  const authGetUser = await timed("auth.getUser", () => supabase.auth.getUser());
  const profile = await timed("profile.select", () =>
    supabase
      .from("profiles")
      .select("id, full_name, is_active")
      .eq("id", userId)
      .maybeSingle(),
  );

  // Pick a real transaction for read-path timing (no writes).
  const sampleTxn = await timed("txn.sample", () =>
    supabase
      .from("patient_transactions")
      .select("id, sale_amount, source_type, device_delivery_status, device_delivered_at")
      .eq("source_type", "manual")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );

  const txnId = sampleTxn.result.data?.id;
  let paymentLimit = null;
  let deliveryRead = null;
  let paymentsList = null;
  let receiptCleanupShape = null;

  if (txnId) {
    paymentLimit = await timed("paymentLimit.parallel", () =>
      Promise.all([
        supabase
          .from("patient_transactions")
          .select("sale_amount, source_type")
          .eq("id", txnId)
          .single(),
        supabase
          .from("transaction_payments")
          .select("amount")
          .eq("transaction_id", txnId),
      ]),
    );

    deliveryRead = await timed("delivery.select", () =>
      supabase
        .from("patient_transactions")
        .select("id, device_delivery_status, device_delivered_at, source_type")
        .eq("id", txnId)
        .single(),
    );

    paymentsList = await timed("payments.select", () =>
      supabase
        .from("transaction_payments")
        .select(
          "id, created_at, updated_at, transaction_id, payment_date, payment_method, amount, description, received_by, receipt_document_id, receipt_generated_at",
        )
        .eq("transaction_id", txnId)
        .order("payment_date", { ascending: false }),
    );

    receiptCleanupShape = await timed("delete.receiptShape", () =>
      Promise.all([
        supabase
          .from("transaction_payments")
          .select("id, receipt_document_id")
          .eq("transaction_id", txnId)
          .not("receipt_document_id", "is", null),
        supabase
          .from("stock_movements")
          .select("id")
          .eq("transaction_id", txnId)
          .eq("movement_type", "return")
          .limit(1),
      ]),
    );
  }

  const documentSample = await timed("document.sample", () =>
    supabase
      .from("documents")
      .select("id, file_path")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );

  const rows = [
    authSignIn,
    authGetUser,
    profile,
    sampleTxn,
    paymentLimit,
    deliveryRead,
    paymentsList,
    receiptCleanupShape,
    documentSample,
  ].filter(Boolean);

  console.log("\n=== Production Supabase hot-path timings (ms) ===\n");
  for (const row of rows) {
    const err =
      row.result?.error ||
      (Array.isArray(row.result)
        ? row.result.find((r) => r.error)?.error
        : null);
    console.log(
      `${row.label.padEnd(28)} ${String(row.ms).padStart(5)} ms` +
        (err ? `  ERROR: ${err.message ?? err}` : ""),
    );
  }

  // Compose estimated action budgets from measured pieces (DB/auth only).
  const authMs = authGetUser.ms + profile.ms;
  const composed = {
    createPatientTransaction_dbAuth: authMs + (sampleTxn.ms || 80),
    addTransactionPayment_dbAuth:
      authMs + (paymentLimit?.ms ?? 0) + 40 /* insert */,
    updateDeviceDeliveryStatus_dbAuth:
      authMs + (deliveryRead?.ms ?? 0) + 40 /* update */,
    deletePatientTransaction_dbAuth:
      authMs + (sampleTxn.ms || 0) + (receiptCleanupShape?.ms ?? 0) + 40,
    deleteDocument_dbAuth: authMs + (documentSample.ms || 0) + 40,
  };

  console.log("\n=== Composed DB+auth budgets (excludes R2/revalidate/network) ===\n");
  for (const [name, ms] of Object.entries(composed)) {
    console.log(`${name.padEnd(40)} ~${ms} ms`);
  }

  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
