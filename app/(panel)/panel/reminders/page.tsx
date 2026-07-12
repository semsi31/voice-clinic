import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import { RemindersTable } from "@/components/panel/reminders-table";
import { panelPageClassName } from "@/components/panel/panel-styles";
import { StatCard } from "@/components/panel/stat-card";
import {
  summarizeReminders,
  type ReminderRecord,
} from "@/lib/reminders";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getReminders(): Promise<ReminderRecord[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("reminders")
    .select(
      "id, reminder_date, reminder_time, title, patient_name, related_record, responsible_person, status, description, created_at, updated_at",
    )
    .order("reminder_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as ReminderRecord[];
}

export default async function RemindersPage() {
  const reminders = await getReminders();
  const summary = summarizeReminders(reminders);

  return (
    <div className={panelPageClassName}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BellRing}
          label="Bugünkü Hatırlatmalar"
          value={String(summary.todayCount)}
          description="Bugün planlanan görevler"
          variant="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Geciken Hatırlatmalar"
          value={String(summary.overdueCount)}
          description="Tamamlanmayı bekleyen takipler"
          variant="red"
        />
        <StatCard
          icon={CalendarClock}
          label="Bu Hafta"
          value={String(summary.thisWeekCount)}
          description="Haftalık planlanan hatırlatmalar"
          variant="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tamamlananlar"
          value={String(summary.completedCount)}
          description="Bu hafta tamamlanan görevler"
          variant="green"
        />
      </section>

      <RemindersTable reminders={reminders} />
    </div>
  );
}
