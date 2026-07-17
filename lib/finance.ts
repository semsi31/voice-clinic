import type { PaymentMethod } from "@/lib/transactions";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type FinanceRecordType = "income" | "expense";

export type FinancePaymentMethod =
  | "cash"
  | "credit_card"
  | "bank_transfer"
  | "other";

export type FinanceRecord = {
  id: string;
  record_date: string;
  type: FinanceRecordType;
  payment_method: FinancePaymentMethod;
  amount: number;
  responsible_person: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceEntrySource =
  | "patient_payment"
  | "manual_income"
  | "manual_expense";

export type FinanceEntryFilterType =
  | "all"
  | FinanceEntrySource;

export type UnifiedFinanceEntry = {
  id: string;
  source: FinanceEntrySource;
  recordDate: string;
  paymentMethod: FinancePaymentMethod | PaymentMethod;
  amount: number;
  responsiblePerson: string | null;
  description: string;
  searchText: string;
  transactionId?: string;
  financeRecord?: FinanceRecord;
};

type PatientPaymentFinanceRow = {
  id: string;
  payment_date: string;
  payment_method: PaymentMethod;
  amount: number | string;
  description: string | null;
  received_by: string | null;
  transaction_id: string;
  patient_transactions: {
    transaction_no: string | null;
    patient_name: string;
  } | {
    transaction_no: string | null;
    patient_name: string;
  }[] | null;
};

export const financeRecordTypeLabels: Record<FinanceRecordType, string> = {
  income: "Gelir",
  expense: "Gider",
};

export const financeEntrySourceLabels: Record<FinanceEntrySource, string> = {
  patient_payment: "Hasta Tahsilatı",
  manual_income: "Manuel Gelir",
  manual_expense: "Gider",
};

export const financePaymentMethodLabels: Record<
  FinancePaymentMethod | PaymentMethod,
  string
> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı",
  bank_transfer: "Havale",
  other: "Diğer",
};

export const financePaymentMethodOptions: {
  value: FinancePaymentMethod;
  label: string;
}[] = [
  { value: "cash", label: "Nakit" },
  { value: "credit_card", label: "Kredi Kartı" },
  { value: "bank_transfer", label: "Havale" },
  { value: "other", label: "Diğer" },
];

export const financeEntryFilterOptions: {
  value: FinanceEntryFilterType;
  label: string;
}[] = [
  { value: "all", label: "Tümü" },
  { value: "patient_payment", label: "Hasta Tahsilatı" },
  { value: "manual_income", label: "Manuel Gelir" },
  { value: "manual_expense", label: "Gider" },
];

export function getCurrentMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

function resolvePatientTransaction(
  value: PatientPaymentFinanceRow["patient_transactions"],
) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function buildPatientPaymentDescription({
  description,
  patientName,
  transactionNo,
  transactionId,
}: {
  description: string | null;
  patientName: string;
  transactionNo: string | null;
  transactionId: string;
}) {
  const parts = [
    description?.trim() || "-",
    patientName,
    transactionNo ?? transactionId,
  ];

  return parts.join(" · ");
}

export function mapFinanceRecordToEntry(
  record: FinanceRecord,
): UnifiedFinanceEntry {
  const source: FinanceEntrySource =
    record.type === "income" ? "manual_income" : "manual_expense";
  const description = record.description?.trim() || "-";

  return {
    id: record.id,
    source,
    recordDate: record.record_date,
    paymentMethod: record.payment_method,
    amount: Number(record.amount ?? 0),
    responsiblePerson: record.responsible_person,
    description,
    searchText: normalizeSearchText(
      [
        description,
        record.responsible_person,
        financeEntrySourceLabels[source],
        financePaymentMethodLabels[record.payment_method],
      ]
        .filter(Boolean)
        .join(" "),
    ),
    financeRecord: record,
  };
}

export function mapPatientPaymentToEntry(
  payment: PatientPaymentFinanceRow,
): UnifiedFinanceEntry | null {
  const transaction = resolvePatientTransaction(payment.patient_transactions);

  if (!transaction) {
    return null;
  }

  const description = buildPatientPaymentDescription({
    description: payment.description,
    patientName: transaction.patient_name,
    transactionNo: transaction.transaction_no,
    transactionId: payment.transaction_id,
  });

  return {
    id: payment.id,
    source: "patient_payment",
    recordDate: payment.payment_date,
    paymentMethod: payment.payment_method,
    amount: Number(payment.amount ?? 0),
    responsiblePerson: payment.received_by,
    description,
    transactionId: payment.transaction_id,
    searchText: normalizeSearchText(
      [
        description,
        payment.description,
        transaction.patient_name,
        transaction.transaction_no,
        payment.transaction_id,
        payment.received_by,
        financeEntrySourceLabels.patient_payment,
        financePaymentMethodLabels[payment.payment_method],
      ]
        .filter(Boolean)
        .join(" "),
    ),
  };
}

export async function fetchPatientPaymentFinanceEntries(
  supabase: SupabaseClient,
): Promise<UnifiedFinanceEntry[]> {
  const { data, error } = await supabase
    .from("transaction_payments")
    .select(
      `
      id,
      payment_date,
      payment_method,
      amount,
      description,
      received_by,
      transaction_id,
      patient_transactions!inner (
        transaction_no,
        patient_name
      )
    `,
    )
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Patient payment finance entries fetch failed", error);
    return [];
  }

  return (data as PatientPaymentFinanceRow[])
    .map(mapPatientPaymentToEntry)
    .filter((entry): entry is UnifiedFinanceEntry => entry !== null);
}

export function mergeFinanceEntries(
  financeRecords: FinanceRecord[],
  patientPayments: UnifiedFinanceEntry[],
): UnifiedFinanceEntry[] {
  const manualEntries = financeRecords.map(mapFinanceRecordToEntry);

  return [...patientPayments, ...manualEntries].sort((left, right) => {
    if (left.recordDate !== right.recordDate) {
      return left.recordDate < right.recordDate ? 1 : -1;
    }

    return left.id < right.id ? 1 : -1;
  });
}

export function summarizeFinanceRecords(records: FinanceRecord[]) {
  const { start, end } = getCurrentMonthBounds();

  const monthlyRecords = records.filter(
    (record) => record.record_date >= start && record.record_date <= end,
  );

  const totalIncome = monthlyRecords
    .filter((record) => record.type === "income")
    .reduce((sum, record) => sum + Number(record.amount), 0);

  const totalExpense = monthlyRecords
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + Number(record.amount), 0);

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    monthlyRecordCount: monthlyRecords.length,
  };
}

export function summarizeUnifiedFinanceEntries(entries: UnifiedFinanceEntry[]) {
  const { start, end } = getCurrentMonthBounds();

  const monthlyEntries = entries.filter(
    (entry) => entry.recordDate >= start && entry.recordDate <= end,
  );

  const patientIncome = monthlyEntries
    .filter((entry) => entry.source === "patient_payment")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const manualIncome = monthlyEntries
    .filter((entry) => entry.source === "manual_income")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalExpense = monthlyEntries
    .filter((entry) => entry.source === "manual_expense")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalIncome = patientIncome + manualIncome;

  return {
    patientIncome,
    manualIncome,
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    monthlyRecordCount: monthlyEntries.length,
  };
}

type FinanceChartBounds = {
  start: string;
  end: string;
};

export function buildFinancePaymentMethodChart(
  entries: UnifiedFinanceEntry[],
  bounds: FinanceChartBounds = getCurrentMonthBounds(),
) {
  const incomeEntries = entries.filter(
    (entry) =>
      entry.recordDate >= bounds.start &&
      entry.recordDate <= bounds.end &&
      (entry.source === "patient_payment" || entry.source === "manual_income"),
  );

  const sumByMethod = (
    method: FinancePaymentMethod | PaymentMethod,
  ) =>
    incomeEntries
      .filter((entry) => entry.paymentMethod === method)
      .reduce((total, entry) => total + entry.amount, 0);

  return [
    { name: "Nakit", value: sumByMethod("cash"), color: "#059669" },
    { name: "Kredi Kartı", value: sumByMethod("credit_card"), color: "#0284c7" },
    { name: "Havale", value: sumByMethod("bank_transfer"), color: "#7c3aed" },
  ];
}

export function filterUnifiedFinanceEntries(
  entries: UnifiedFinanceEntry[],
  {
    filterDate,
    entryType,
    paymentMethod,
    searchQuery,
  }: {
    filterDate: string;
    entryType: FinanceEntryFilterType;
    paymentMethod: "all" | FinancePaymentMethod | PaymentMethod;
    searchQuery: string;
  },
) {
  const normalizedSearch = normalizeSearchText(searchQuery);

  return entries.filter((entry) => {
    const matchesDate = !filterDate || entry.recordDate === filterDate;
    const matchesType = entryType === "all" || entry.source === entryType;
    const matchesPaymentMethod =
      paymentMethod === "all" || entry.paymentMethod === paymentMethod;
    const matchesSearch =
      !normalizedSearch || entry.searchText.includes(normalizedSearch);

    return matchesDate && matchesType && matchesPaymentMethod && matchesSearch;
  });
}
