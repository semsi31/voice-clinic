import { notFound } from "next/navigation";
import { TransactionDetailWorkspace } from "@/components/panel/transaction-detail-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { PatientTransactionRecord } from "@/lib/transactions";

const transactionDetailColumns =
  "id, created_at, updated_at, transaction_no, patient_name, patient_phone, description, branch, transaction_date, hospital, doctor_name, reference_source, operation_description, staff_name, brand, model, serial_no, ear_side, sale_amount, paid_amount, remaining_debt, payment_status, stock_deduct_enabled, stock_product_id, stock_product_label, stock_quantity, notes, source_type, legacy_sheet_name, legacy_row_number, device_delivery_status, device_delivered_at";

async function getTransaction(id: string): Promise<PatientTransactionRecord | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data: transaction, error } = await supabase
    .from("patient_transactions")
    .select(transactionDetailColumns)
    .eq("id", id)
    .single();

  if (error || !transaction) {
    return null;
  }

  return transaction as PatientTransactionRecord;
}

type TransactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailPage({
  params,
}: Readonly<TransactionDetailPageProps>) {
  const { id } = await params;
  const transaction = await getTransaction(id);

  if (!transaction) {
    notFound();
  }

  return <TransactionDetailWorkspace transaction={transaction} />;
}
