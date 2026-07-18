import {

  ArrowDownCircle,

  ArrowUpCircle,

  CalendarDays,

  TrendingUp,

} from "lucide-react";

import { FinanceRecordsTable } from "@/components/panel/finance-records-table";
import {
  panelPageClassName,
  panelStatGridClassName,
} from "@/components/panel/panel-styles";
import { StatCard } from "@/components/panel/stat-card";
import {
  fetchPatientPaymentFinanceEntries,
  mergeFinanceEntries,
  summarizeUnifiedFinanceEntries,
  type FinanceRecord,
} from "@/lib/finance";

import { isSupabaseConfigured } from "@/lib/supabase/config";

import { createClient } from "@/lib/supabase/server";

import { formatCurrency } from "@/lib/transactions";



async function getFinanceRecords(): Promise<FinanceRecord[]> {

  if (!isSupabaseConfigured()) {

    return [];

  }



  const supabase = await createClient();

  const { data } = await supabase

    .from("finance_records")

    .select(

      "id, record_date, type, payment_method, amount, responsible_person, description, created_by, created_at, updated_at",

    )

    .order("record_date", { ascending: false })

    .order("created_at", { ascending: false });



  return (data ?? []) as FinanceRecord[];

}



export default async function IncomeExpensePage() {

  const supabase = isSupabaseConfigured() ? await createClient() : null;

  const financeRecords = await getFinanceRecords();

  const patientPayments = supabase

    ? await fetchPatientPaymentFinanceEntries(supabase)

    : [];

  const entries = mergeFinanceEntries(financeRecords, patientPayments);

  const summary = summarizeUnifiedFinanceEntries(entries);

  return (

    <div className={panelPageClassName}>

      <section className={panelStatGridClassName}>

        <StatCard

          icon={ArrowUpCircle}

          label="Toplam Gelir"

          value={formatCurrency(summary.totalIncome)}

          description="Bu ay hasta tahsilatları ve manuel gelirler"

          variant="green"

        />

        <StatCard

          icon={ArrowDownCircle}

          label="Toplam Gider"

          value={formatCurrency(summary.totalExpense)}

          description="Bu ay manuel gider toplamı"

          variant="red"

        />

        <StatCard

          icon={TrendingUp}

          label="Net Durum"

          value={formatCurrency(summary.netBalance)}

          description="Bu ay gelir-gider farkı"

          variant="blue"

        />

        <StatCard

          icon={CalendarDays}

          label="Bu Ay Kayıt Sayısı"

          value={String(summary.monthlyRecordCount)}

          description="Bu ay hasta tahsilatı ve manuel kayıt sayısı"

          variant="purple"

        />

      </section>

      <FinanceRecordsTable entries={entries} />

    </div>

  );

}

