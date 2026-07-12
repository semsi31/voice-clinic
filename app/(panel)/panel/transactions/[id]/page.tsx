import { notFound } from "next/navigation";
import { TransactionDetailWorkspace } from "@/components/panel/transaction-detail-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type {
  PatientTransactionRecord,
  TransactionPaymentRecord,
} from "@/lib/transactions";
import type { ReminderRecord } from "@/lib/reminders";

async function getTransactionDetail(id: string): Promise<{
  transaction: PatientTransactionRecord;
  payments: TransactionPaymentRecord[];
  reminder: ReminderRecord | null;
} | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data: transaction, error: transactionError } = await supabase
    .from("patient_transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (transactionError || !transaction) {
    return null;
  }

  const { data: payments } = await supabase
    .from("transaction_payments")
    .select("*")
    .eq("transaction_id", id)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  const transactionRecord = transaction as PatientTransactionRecord;
  const lookupValues = transactionRecord.transaction_no
    ? [transactionRecord.id, transactionRecord.transaction_no]
    : [transactionRecord.id];

  const { data: reminder } = await supabase
    .from("reminders")
    .select(
      "id, reminder_date, reminder_time, title, patient_name, related_record, responsible_person, status, description, created_at, updated_at",
    )
    .in("related_record", lookupValues)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    transaction: transactionRecord,
    payments: (payments ?? []) as TransactionPaymentRecord[],
    reminder: (reminder ?? null) as ReminderRecord | null,
  };
}

type TransactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailPage({
  params,
}: Readonly<TransactionDetailPageProps>) {
  const { id } = await params;
  const detail = await getTransactionDetail(id);

  if (!detail) {
    notFound();
  }

  return <TransactionDetailWorkspace {...detail} />;
}
