import { notFound } from "next/navigation";
import { TransactionDetailWorkspace } from "@/components/panel/transaction-detail-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type {
  PatientTransactionRecord,
  TransactionPaymentRecord,
} from "@/lib/transactions";
import type { ReminderRecord } from "@/lib/reminders";

const transactionDetailColumns =
  "id, created_at, updated_at, transaction_no, patient_name, patient_phone, description, branch, transaction_date, hospital, doctor_name, reference_source, operation_description, staff_name, brand, model, serial_no, ear_side, sale_amount, paid_amount, remaining_debt, payment_status, stock_deduct_enabled, stock_product_id, stock_product_label, stock_quantity, notes, source_type, legacy_sheet_name, legacy_row_number, device_delivery_status, device_delivered_at";

const paymentDetailColumns =
  "id, created_at, updated_at, transaction_id, payment_date, payment_method, amount, description, received_by, receipt_document_id, receipt_generated_at";

const reminderDetailColumns =
  "id, reminder_date, reminder_time, title, patient_name, related_record, responsible_person, status, description, created_at, updated_at";

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
    .select(transactionDetailColumns)
    .eq("id", id)
    .single();

  if (transactionError || !transaction) {
    return null;
  }

  const transactionRecord = transaction as PatientTransactionRecord;
  const lookupValues = transactionRecord.transaction_no
    ? [transactionRecord.id, transactionRecord.transaction_no]
    : [transactionRecord.id];

  const [paymentsResult, reminderResult] = await Promise.all([
    supabase
      .from("transaction_payments")
      .select(paymentDetailColumns)
      .eq("transaction_id", id)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("reminders")
      .select(reminderDetailColumns)
      .in("related_record", lookupValues)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    transaction: transactionRecord,
    payments: (paymentsResult.data ?? []) as TransactionPaymentRecord[],
    reminder: (reminderResult.data ?? null) as ReminderRecord | null,
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
