import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDefaultReportFilter, getMonthDateBounds } from "@/lib/reports";
import { getTodayDateString } from "@/lib/reminders";
import type { CargoStatus } from "@/lib/cargo";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/transactions";
import type { ReminderStatus } from "@/lib/reminders";

export type DashboardMetrics = {
  todayCollections: number;
  todayPaymentCount: number;
  monthlySales: number;
  monthlyExpenses: number;
  totalOpenDebt: number;
  openDebtTransactionCount: number;
  todayReminders: number;
  pendingCargoCount: number;
  criticalStockCount: number;
  monthlyTransactionCount: number;
};

export type DashboardRecentTransaction = {
  id: string;
  patientName: string;
  operation: string;
  date: string;
  saleAmount: number;
  paymentStatus: PaymentStatus;
  remainingDebt: number;
};

export type DashboardReminderItem = {
  id: string;
  title: string;
  patientName: string;
  date: string;
  time: string | null;
  status: ReminderStatus;
  isOverdue: boolean;
};

export type DashboardStockItem = {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
};

export type DashboardCargoItem = {
  id: string;
  senderName: string;
  cargoCompany: string;
  trackingNumber: string | null;
  status: CargoStatus;
};

export type DashboardData = {
  metrics: DashboardMetrics;
  recentTransactions: DashboardRecentTransaction[];
  reminders: DashboardReminderItem[];
  criticalStock: DashboardStockItem[];
  pendingCargo: DashboardCargoItem[];
};

function sumAmounts(values: Array<number | string | null | undefined>) {
  return values.reduce<number>((total, value) => {
    const parsed = Number(value ?? 0);
    return total + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
}

function emptyDashboardData(): DashboardData {
  return {
    metrics: {
      todayCollections: 0,
      todayPaymentCount: 0,
      monthlySales: 0,
      monthlyExpenses: 0,
      totalOpenDebt: 0,
      openDebtTransactionCount: 0,
      todayReminders: 0,
      pendingCargoCount: 0,
      criticalStockCount: 0,
      monthlyTransactionCount: 0,
    },
    recentTransactions: [],
    reminders: [],
    criticalStock: [],
    pendingCargo: [],
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) {
    return emptyDashboardData();
  }

  const supabase = await createClient();
  const today = getTodayDateString();
  const { month, year } = getDefaultReportFilter();
  const { start, end } = getMonthDateBounds(month, year);

  const [
    todayPaymentsResult,
    monthlyTransactionsResult,
    monthlyFinanceResult,
    openDebtResult,
    todayRemindersResult,
    pendingCargoCountResult,
    stockResult,
    recentTransactionsResult,
    reminderListResult,
    pendingCargoListResult,
  ] = await Promise.all([
    supabase
      .from("transaction_payments")
      .select("amount")
      .eq("payment_date", today),
    supabase
      .from("patient_transactions")
      .select("sale_amount")
      .eq("source_type", "manual")
      .gte("transaction_date", start)
      .lte("transaction_date", end),
    supabase
      .from("finance_records")
      .select("amount, type")
      .gte("record_date", start)
      .lte("record_date", end),
    supabase
      .from("patient_transactions")
      .select("remaining_debt")
      .eq("source_type", "manual")
      .gt("remaining_debt", 0),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .lte("reminder_date", today)
      .in("status", ["pending", "delayed"]),
    supabase
      .from("cargo_records")
      .select("id", { count: "exact", head: true })
      .in("status", ["prepared", "shipped", "problem"]),
    supabase.from("stock_products").select("id, name, quantity, min_stock"),
    supabase
      .from("patient_transactions")
      .select(
        "id, patient_name, operation_description, transaction_date, sale_amount, payment_status, remaining_debt",
      )
      .eq("source_type", "manual")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("reminders")
      .select("id, title, patient_name, reminder_date, reminder_time, status")
      .in("status", ["pending", "delayed"])
      .or(`reminder_date.eq.${today},reminder_date.lt.${today}`)
      .order("reminder_date", { ascending: true })
      .limit(5),
    supabase
      .from("cargo_records")
      .select("id, sender_name, cargo_company, tracking_number, status")
      .in("status", ["prepared", "shipped", "problem"])
      .order("cargo_date", { ascending: false })
      .limit(5),
  ]);

  const todayPayments = todayPaymentsResult.data ?? [];
  const monthlyTransactions = monthlyTransactionsResult.data ?? [];
  const monthlyFinance = monthlyFinanceResult.data ?? [];
  const openDebtRows = openDebtResult.data ?? [];
  const stockProducts = stockResult.data ?? [];

  const criticalStockAll = stockProducts
    .filter((product) => product.quantity <= product.min_stock)
    .map((product) => ({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      minStock: product.min_stock,
    }))
    .sort((a, b) => a.quantity - b.quantity);

  const reminders = (reminderListResult.data ?? []).map((reminder) => ({
    id: reminder.id,
    title: reminder.title,
    patientName: reminder.patient_name || "-",
    date: reminder.reminder_date,
    time: reminder.reminder_time,
    status: reminder.status as ReminderStatus,
    isOverdue: reminder.reminder_date < today,
  }));

  return {
    metrics: {
      todayCollections: sumAmounts(todayPayments.map((payment) => payment.amount)),
      todayPaymentCount: todayPayments.length,
      monthlySales: sumAmounts(
        monthlyTransactions.map((transaction) => transaction.sale_amount),
      ),
      monthlyExpenses: sumAmounts(
        monthlyFinance
          .filter((record) => record.type === "expense")
          .map((record) => record.amount),
      ),
      totalOpenDebt: sumAmounts(openDebtRows.map((row) => row.remaining_debt)),
      openDebtTransactionCount: openDebtRows.length,
      todayReminders: todayRemindersResult.count ?? 0,
      pendingCargoCount: pendingCargoCountResult.count ?? 0,
      criticalStockCount: criticalStockAll.length,
      monthlyTransactionCount: monthlyTransactions.length,
    },
    recentTransactions: (recentTransactionsResult.data ?? []).map((transaction) => ({
      id: transaction.id,
      patientName: transaction.patient_name,
      operation: transaction.operation_description,
      date: transaction.transaction_date,
      saleAmount: Number(transaction.sale_amount ?? 0),
      paymentStatus: transaction.payment_status as PaymentStatus,
      remainingDebt: Number(transaction.remaining_debt ?? 0),
    })),
    reminders,
    criticalStock: criticalStockAll.slice(0, 5),
    pendingCargo: (pendingCargoListResult.data ?? []).map((cargo) => ({
      id: cargo.id,
      senderName: cargo.sender_name,
      cargoCompany: cargo.cargo_company,
      trackingNumber: cargo.tracking_number,
      status: cargo.status as CargoStatus,
    })),
  };
}
