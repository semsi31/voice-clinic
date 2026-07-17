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

const TRANSACTIONS_PAGE_SIZE = 50;

const TRANSACTION_LIST_COLUMNS =
  "id, created_at, transaction_no, patient_name, patient_phone, branch, transaction_date, operation_description, brand, model, sale_amount, paid_amount, remaining_debt, payment_status, source_type";

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
    .select(TRANSACTION_LIST_COLUMNS, { count: "exact" })
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

async function getFinancialSummary() {
  if (!isSupabaseConfigured()) {
    return {
      monthlySaleAmount: 0,
      totalPaidAmount: 0,
      totalRemainingDebt: 0,
    };
  }

  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const [monthlyResult, totalsResult] = await Promise.all([
    supabase
      .from("patient_transactions")
      .select("sale_amount")
      .eq("source_type", "manual")
      .gte("transaction_date", monthStart)
      .lte("transaction_date", monthEnd),
    supabase
      .from("patient_transactions")
      .select("paid_amount, remaining_debt")
      .eq("source_type", "manual"),
  ]);

  const monthlyRows = monthlyResult.data ?? [];
  const totalRows = totalsResult.data ?? [];

  return {
    monthlySaleAmount: monthlyRows.reduce(
      (total, row) => total + Number(row.sale_amount ?? 0),
      0,
    ),
    totalPaidAmount: totalRows.reduce(
      (total, row) => total + Number(row.paid_amount ?? 0),
      0,
    ),
    totalRemainingDebt: totalRows.reduce(
      (total, row) => total + Number(row.remaining_debt ?? 0),
      0,
    ),
  };
}

type TransactionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({
  searchParams,
}: Readonly<TransactionsPageProps>) {
  const filters = normalizeFilters((await searchParams) ?? {});
  const [{ transactions, totalCount }, financialSummary] = await Promise.all([
    getTransactions(filters),
    getFinancialSummary(),
  ]);
  const { monthlySaleAmount, totalPaidAmount, totalRemainingDebt } =
    financialSummary;
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
