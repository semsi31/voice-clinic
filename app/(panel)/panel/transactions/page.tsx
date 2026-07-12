import { ReceiptText } from "lucide-react";
import { panelPageClassName } from "@/components/panel/panel-styles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  type PatientTransactionRecord,
  type PaymentStatus,
} from "@/lib/transactions";
import { TransactionsTable } from "@/components/panel/transactions-table";

const TRANSACTIONS_PAGE_SIZE = 100;

type TransactionSourceFilter = "all" | "manual" | "legacy_excel";

type TransactionListFilters = {
  search: string;
  operation: string;
  paymentStatus: "all" | PaymentStatus;
  sourceType: TransactionSourceFilter;
  page: number;
};

type TransactionListResult = {
  transactions: PatientTransactionRecord[];
  totalCount: number;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalizeFilters(
  searchParams: Record<string, string | string[] | undefined>,
): TransactionListFilters {
  const paymentStatusRaw = readSearchParam(searchParams, "paymentStatus");
  const sourceTypeRaw = readSearchParam(searchParams, "source");
  const pageRaw = Number(readSearchParam(searchParams, "page") || "1");

  return {
    search: readSearchParam(searchParams, "search").trim(),
    operation: readSearchParam(searchParams, "operation").trim(),
    paymentStatus:
      paymentStatusRaw === "paid" ||
      paymentStatusRaw === "partial" ||
      paymentStatusRaw === "unpaid"
        ? paymentStatusRaw
        : "all",
    sourceType:
      sourceTypeRaw === "all" || sourceTypeRaw === "legacy_excel"
        ? sourceTypeRaw
        : "manual",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

function escapeIlikeTerm(value: string) {
  return value.replace(/[,%]/g, " ").replace(/\s+/g, " ").trim();
}

async function getTransactions(
  filters: TransactionListFilters,
): Promise<TransactionListResult> {
  if (!isSupabaseConfigured()) {
    return { transactions: [], totalCount: 0 };
  }

  const supabase = await createClient();
  const from = (filters.page - 1) * TRANSACTIONS_PAGE_SIZE;
  const to = from + TRANSACTIONS_PAGE_SIZE - 1;
  let query = supabase
    .from("patient_transactions")
    .select("*", { count: "exact" })
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.sourceType !== "all") {
    query = query.eq("source_type", filters.sourceType);
  }

  if (filters.paymentStatus !== "all") {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  const operation = escapeIlikeTerm(filters.operation);
  if (operation) {
    query = query.ilike("operation_description", `%${operation}%`);
  }

  const search = escapeIlikeTerm(filters.search);
  if (search) {
    query = query.or(
      [
        `patient_name.ilike.%${search}%`,
        `reference_source.ilike.%${search}%`,
        `operation_description.ilike.%${search}%`,
        `notes.ilike.%${search}%`,
      ].join(","),
    );
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return { transactions: [], totalCount: 0 };
  }

  return {
    transactions: data as PatientTransactionRecord[],
    totalCount: count ?? 0,
  };
}

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

async function getFinancialTransactions(): Promise<PatientTransactionRecord[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_transactions")
    .select("id, transaction_date, sale_amount, paid_amount, remaining_debt")
    .neq("source_type", "legacy_excel");

  if (error || !data) {
    return [];
  }

  return data as PatientTransactionRecord[];
}

type TransactionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({
  searchParams,
}: Readonly<TransactionsPageProps>) {
  const filters = normalizeFilters((await searchParams) ?? {});
  const [{ transactions, totalCount }, financialTransactions] = await Promise.all([
    getTransactions(filters),
    getFinancialTransactions(),
  ]);
  const monthlySaleAmount = financialTransactions
    .filter((transaction) => isCurrentMonth(transaction.transaction_date))
    .reduce((total, transaction) => total + Number(transaction.sale_amount), 0);
  const totalPaidAmount = financialTransactions.reduce(
    (total, transaction) => total + Number(transaction.paid_amount),
    0,
  );
  const totalRemainingDebt = financialTransactions.reduce(
    (total, transaction) => total + Number(transaction.remaining_debt),
    0,
  );
  const summaryCards = [
    {
      label: "Toplam İşlem",
      value: String(totalCount),
      description:
        filters.sourceType === "legacy_excel"
          ? "Seçili kaynakta listelenen eski Excel kaydı"
          : filters.sourceType === "all"
            ? "Seçili filtrelerde listelenen hasta işlemi"
            : "Seçili filtrelerde listelenen normal hasta işlemi",
    },
    {
      label: "Bu Ay Satış",
      value: formatCurrency(monthlySaleAmount),
      description: "Bu ay normal işlem satışları",
    },
    {
      label: "Tahsil Edilen",
      value: formatCurrency(totalPaidAmount),
      description: "Tüm normal işlemlerden tahsil edilen",
    },
    {
      label: "Kalan Borç",
      value: formatCurrency(totalRemainingDebt),
      description: "Tüm normal işlemlerde kalan borç",
    },
  ];

  return (
    <div className={panelPageClassName}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {card.value}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <ReceiptText className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
              {card.description}
            </p>
          </article>
        ))}
      </section>

      <TransactionsTable
        transactions={transactions}
        filters={filters}
        totalCount={totalCount}
        pageSize={TRANSACTIONS_PAGE_SIZE}
      />
    </div>
  );
}
