import {
  CalendarDays,
  CheckCircle2,
  Inbox,
  Sparkles,
} from "lucide-react";
import { panelPageClassName } from "@/components/panel/panel-styles";
import { StatCard } from "@/components/panel/stat-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  WebRequestsTable,
  type WebRequestRecord,
} from "@/components/panel/web-requests-table";

async function getWebRequests(): Promise<WebRequestRecord[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("web_requests")
    .select(
      "id, created_at, name, phone, email, request_type, subject, preferred_branch, message, status, status_note, source",
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as WebRequestRecord[];
}

function isToday(value: string): boolean {
  const requestDate = new Date(value);
  const today = new Date();

  return (
    requestDate.getFullYear() === today.getFullYear() &&
    requestDate.getMonth() === today.getMonth() &&
    requestDate.getDate() === today.getDate()
  );
}

export default async function RequestsPage() {
  const requests = await getWebRequests();
  const newRequestCount = requests.filter(
    (request) => request.status === "new",
  ).length;
  const todayRequestCount = requests.filter((request) =>
    isToday(request.created_at),
  ).length;
  const completedRequestCount = requests.filter(
    (request) => request.status === "completed",
  ).length;

  return (
    <div className={panelPageClassName}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Inbox}
          label="Toplam Talep"
          value={String(requests.length)}
          description="Web sitesinden gelen talepler"
          variant="blue"
        />
        <StatCard
          icon={Sparkles}
          label="Yeni Talepler"
          value={String(newRequestCount)}
          description="Henüz görüşülmemiş talepler"
          variant="amber"
        />
        <StatCard
          icon={CalendarDays}
          label="Bugünkü Talepler"
          value={String(todayRequestCount)}
          description="Bugün gelen talep sayısı"
          variant="purple"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tamamlanan Talepler"
          value={String(completedRequestCount)}
          description="Sonuçlandırılmış talepler"
          variant="green"
        />
      </section>

      <WebRequestsTable requests={requests} />
    </div>
  );
}
