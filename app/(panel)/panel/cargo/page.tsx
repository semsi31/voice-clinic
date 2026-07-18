import {
  AlertTriangle,
  Package,
  PackageCheck,
  Truck,
} from "lucide-react";
import { CargoRecordsTable } from "@/components/panel/cargo-records-table";
import {
  panelPageClassName,
  panelStatGridClassName,
} from "@/components/panel/panel-styles";
import { StatCard } from "@/components/panel/stat-card";
import { summarizeCargoRecords, type CargoRecord } from "@/lib/cargo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getCargoRecords(): Promise<CargoRecord[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("cargo_records")
    .select(
      "id, cargo_date, sender_name, process_description, cargo_company, cargo_branch, tracking_number, status, note, created_by, created_at, updated_at",
    )
    .order("cargo_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as CargoRecord[];
}

export default async function CargoPage() {
  const records = await getCargoRecords();
  const summary = summarizeCargoRecords(records);

  return (
    <div className={panelPageClassName}>
      <section className={panelStatGridClassName}>
        <StatCard
          icon={Package}
          label="Hazırlanan"
          value={String(summary.prepared)}
          description="Hazırlanan kargo kayıtları"
          variant="amber"
        />
        <StatCard
          icon={Truck}
          label="Gönderilen"
          value={String(summary.shipped)}
          description="Yolda olan kargo kayıtları"
          variant="blue"
        />
        <StatCard
          icon={PackageCheck}
          label="Teslim Edilen"
          value={String(summary.delivered)}
          description="Başarıyla tamamlanan gönderiler"
          variant="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Sorunlu"
          value={String(summary.problem)}
          description="Takip ve müdahale gerektiren kayıtlar"
          variant="red"
        />
      </section>

      <CargoRecordsTable records={records} />
    </div>
  );
}
