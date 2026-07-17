import type { ReportsPaymentChartDatum } from "@/components/panel/reports-payment-chart";
import type { FinancePaymentMethod } from "@/lib/finance";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/transactions";

export type ReportFilter = {
  month: number;
  year: number;
};

export type TopOperationItem = {
  name: string;
  count: number;
  totalSales: number;
};

export type CriticalStockItem = {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
};

export type MonthlyReportData = {
  filter: ReportFilter;
  totalSales: number;
  totalCollections: number;
  totalExpenses: number;
  manualIncome: number;
  netBalance: number;
  totalOpenDebt: number;
  transactionCount: number;
  cashCollections: number;
  creditCardCollections: number;
  bankTransferCollections: number;
  paymentMethodChart: ReportsPaymentChartDatum[];
  topOperations: TopOperationItem[];
  criticalStock: CriticalStockItem[];
};

export const monthOptions = [
  { value: 1, label: "Ocak" },
  { value: 2, label: "Şubat" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Nisan" },
  { value: 5, label: "Mayıs" },
  { value: 6, label: "Haziran" },
  { value: 7, label: "Temmuz" },
  { value: 8, label: "Ağustos" },
  { value: 9, label: "Eylül" },
  { value: 10, label: "Ekim" },
  { value: 11, label: "Kasım" },
  { value: 12, label: "Aralık" },
] as const;

export function getDefaultReportFilter(): ReportFilter {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export function parseReportFilter(
  monthValue?: string,
  yearValue?: string,
): ReportFilter {
  const defaults = getDefaultReportFilter();
  const month = Number(monthValue);
  const year = Number(yearValue);

  return {
    month:
      Number.isInteger(month) && month >= 1 && month <= 12
        ? month
        : defaults.month,
    year:
      Number.isInteger(year) && year >= 2000 && year <= 2100
        ? year
        : defaults.year,
  };
}

export function getMonthDateBounds(month: number, year: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = endDate.toISOString().slice(0, 10);

  return { start, end };
}

function sumAmounts(values: Array<number | string | null | undefined>) {
  return values.reduce<number>((total, value) => {
    const parsed = Number(value ?? 0);
    return total + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
}

function sumIncomeByPaymentMethod(
  payments: Array<{ amount: number | string; payment_method: PaymentMethod }>,
  manualIncomeRecords: Array<{
    amount: number | string;
    payment_method: FinancePaymentMethod;
  }>,
  method: PaymentMethod | FinancePaymentMethod,
) {
  return sumAmounts([
    ...payments
      .filter((payment) => payment.payment_method === method)
      .map((payment) => payment.amount),
    ...manualIncomeRecords
      .filter((record) => record.payment_method === method)
      .map((record) => record.amount),
  ]);
}

function buildTopOperations(
  transactions: Array<{ operation_description: string; sale_amount: number }>,
): TopOperationItem[] {
  const grouped = new Map<string, { count: number; totalSales: number }>();

  for (const transaction of transactions) {
    const name = transaction.operation_description?.trim() || "Belirtilmemiş";
    const current = grouped.get(name) ?? { count: 0, totalSales: 0 };
    grouped.set(name, {
      count: current.count + 1,
      totalSales: current.totalSales + Number(transaction.sale_amount ?? 0),
    });
  }

  return Array.from(grouped.entries())
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      totalSales: stats.totalSales,
    }))
    .sort((a, b) => b.count - a.count || b.totalSales - a.totalSales)
    .slice(0, 5);
}

function emptyReportData(filter: ReportFilter): MonthlyReportData {
  return {
    filter,
    totalSales: 0,
    totalCollections: 0,
    totalExpenses: 0,
    manualIncome: 0,
    netBalance: 0,
    totalOpenDebt: 0,
    transactionCount: 0,
    cashCollections: 0,
    creditCardCollections: 0,
    bankTransferCollections: 0,
    paymentMethodChart: [
      { name: "Nakit", value: 0, color: "#059669" },
      { name: "Kredi Kartı", value: 0, color: "#0284c7" },
      { name: "Havale", value: 0, color: "#7c3aed" },
    ],
    topOperations: [],
    criticalStock: [],
  };
}

export async function fetchMonthlyReport(
  filter: ReportFilter,
): Promise<MonthlyReportData> {
  if (!isSupabaseConfigured()) {
    return emptyReportData(filter);
  }

  const supabase = await createClient();
  const { start, end } = getMonthDateBounds(filter.month, filter.year);

  const [
    transactionsResult,
    paymentsResult,
    financeResult,
    stockResult,
  ] = await Promise.all([
    supabase
      .from("patient_transactions")
      .select("sale_amount, operation_description, remaining_debt")
      .neq("source_type", "legacy_excel")
      .gte("transaction_date", start)
      .lte("transaction_date", end),
    supabase
      .from("transaction_payments")
      .select("amount, payment_method")
      .gte("payment_date", start)
      .lte("payment_date", end),
    supabase
      .from("finance_records")
      .select("amount, type, payment_method")
      .gte("record_date", start)
      .lte("record_date", end),
    supabase.from("stock_products").select("id, name, quantity, min_stock"),
  ]);

  const transactions = transactionsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const financeRecords = financeResult.data ?? [];
  const stockProducts = stockResult.data ?? [];
  const manualIncomeRecords = financeRecords.filter(
    (record) => record.type === "income",
  );

  const totalSales = sumAmounts(transactions.map((row) => row.sale_amount));
  const transactionCount = transactions.length;

  const cashChartValue = sumIncomeByPaymentMethod(
    payments,
    manualIncomeRecords,
    "cash",
  );
  const creditCardChartValue = sumIncomeByPaymentMethod(
    payments,
    manualIncomeRecords,
    "credit_card",
  );
  const bankTransferChartValue = sumIncomeByPaymentMethod(
    payments,
    manualIncomeRecords,
    "bank_transfer",
  );

  const totalCollections = sumAmounts(payments.map((payment) => payment.amount));

  const totalExpenses = sumAmounts(
    financeRecords
      .filter((record) => record.type === "expense")
      .map((record) => record.amount),
  );

  const manualIncome = sumAmounts(
    manualIncomeRecords.map((record) => record.amount),
  );

  const netBalance = totalCollections + manualIncome - totalExpenses;

  const totalOpenDebt = sumAmounts(
    transactions
      .map((row) => Number(row.remaining_debt ?? 0))
      .filter((debt) => debt > 0),
  );

  const criticalStock = stockProducts
    .filter((product) => product.quantity <= product.min_stock)
    .map((product) => ({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      minStock: product.min_stock,
    }))
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  return {
    filter,
    totalSales,
    totalCollections,
    totalExpenses,
    manualIncome,
    netBalance,
    totalOpenDebt,
    transactionCount,
    cashCollections: cashChartValue,
    creditCardCollections: creditCardChartValue,
    bankTransferCollections: bankTransferChartValue,
    paymentMethodChart: [
      { name: "Nakit", value: cashChartValue, color: "#059669" },
      { name: "Kredi Kartı", value: creditCardChartValue, color: "#0284c7" },
      { name: "Havale", value: bankTransferChartValue, color: "#7c3aed" },
    ],
    topOperations: buildTopOperations(transactions),
    criticalStock,
  };
}

export function getYearOptions(currentYear: number) {
  return Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
}
