import { ReceiptText } from "lucide-react";
import {
  panelPageClassName,
  panelStatGridClassName,
} from "@/components/panel/panel-styles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  type DeviceDeliveryStatus,
  type PatientTransactionRecord,
  type PaymentStatus,
} from "@/lib/transactions";
import { TransactionsTable } from "@/components/panel/transactions-table";

const TRANSACTIONS_PAGE_SIZE = 50;

const TRANSACTION_LIST_COLUMNS =
  "id, created_at, transaction_no, patient_name, patient_phone, branch, transaction_date, operation_description, brand, model, sale_amount, paid_amount, remaining_debt, payment_status, source_type, stock_product_label, device_delivery_status, device_delivered_at";

/** Fallback when device_delivery_* migration is not applied yet. */
const TRANSACTION_LIST_COLUMNS_LEGACY =
  "id, created_at, transaction_no, patient_name, patient_phone, branch, transaction_date, operation_description, brand, model, sale_amount, paid_amount, remaining_debt, payment_status, source_type, stock_product_label";

function isMissingDeviceDeliveryColumnError(message: string | undefined) {
  if (!message) return false;
  return (
    message.includes("device_delivery_status") ||
    message.includes("device_delivered_at")
  );
}

function normalizeTransactionRow(
  row: Record<string, unknown>,
): PatientTransactionRecord {
  const record = row as PatientTransactionRecord;
  return {
    ...record,
    device_delivery_status: record.device_delivery_status ?? "pending",
    device_delivered_at: record.device_delivered_at ?? null,
  };
}

type TransactionSourceFilter = "all" | "manual" | "legacy_excel";

type TransactionListFilters = {
  search: string;
  operation: string;
  paymentStatus: "all" | PaymentStatus;
  deliveryStatus: "all" | DeviceDeliveryStatus;
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
  const deliveryStatusRaw = readSearchParam(searchParams, "deliveryStatus");
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
    deliveryStatus:
      deliveryStatusRaw === "pending" || deliveryStatusRaw === "delivered"
        ? deliveryStatusRaw
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

  const buildQuery = (columns: string, includeDeliveryFilter: boolean) => {
    let query = supabase
      .from("patient_transactions")
      .select(columns, { count: "exact" })
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters.sourceType !== "all") {
      query = query.eq("source_type", filters.sourceType);
    }

    if (filters.paymentStatus !== "all") {
      query = query.eq("payment_status", filters.paymentStatus);
    }

    if (includeDeliveryFilter && filters.deliveryStatus !== "all") {
      query = query.eq("device_delivery_status", filters.deliveryStatus);
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

    return query;
  };

  const primary = await buildQuery(TRANSACTION_LIST_COLUMNS, true);

  if (!primary.error && primary.data) {
    return {
      transactions: (primary.data as unknown as Record<string, unknown>[]).map(
        (row) => normalizeTransactionRow(row),
      ),
      totalCount: primary.count ?? 0,
    };
  }

  if (isMissingDeviceDeliveryColumnError(primary.error?.message)) {
    console.warn(
      "[transactions] device_delivery_* columns missing — run migration 20260729000000_device_delivery_status.sql",
    );
    const fallback = await buildQuery(TRANSACTION_LIST_COLUMNS_LEGACY, false);
    if (!fallback.error && fallback.data) {
      return {
        transactions: (
          fallback.data as unknown as Record<string, unknown>[]
        ).map((row) => normalizeTransactionRow(row)),
        totalCount: fallback.count ?? 0,
      };
    }
    console.error(
      "[transactions] legacy list query failed:",
      fallback.error?.message,
      fallback.error?.code,
    );
    return { transactions: [], totalCount: 0 };
  }

  console.error(
    "[transactions] list query failed:",
    primary.error?.message,
    primary.error?.code,
  );
  return { transactions: [], totalCount: 0 };
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
      <section className={panelStatGridClassName}>
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  {card.label}
                </p>
                <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-950 sm:mt-2 sm:text-2xl">
                  {card.value}
                </p>
              </div>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:size-10 sm:rounded-2xl">
                <ReceiptText className="size-4 sm:size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 hidden line-clamp-2 text-sm leading-6 text-slate-600 sm:mt-3 sm:block">
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
