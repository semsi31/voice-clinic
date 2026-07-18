import { File, FileText, FolderOpen, Upload } from "lucide-react";
import { DocumentsTable } from "@/components/panel/documents-table";
import {
  panelPageClassName,
  panelStatGridClassName,
} from "@/components/panel/panel-styles";
import { StatCard } from "@/components/panel/stat-card";
import {
  summarizeDocuments,
  type DocumentRecord,
} from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getDocuments(): Promise<DocumentRecord[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "id, title, file_type, file_size, file_name, file_path, description, created_by, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  return (data ?? []) as DocumentRecord[];
}

export default async function DocumentsPage() {
  const documents = await getDocuments();
  const summary = summarizeDocuments(documents);

  return (
    <div className={panelPageClassName}>
      <section className={panelStatGridClassName}>
        <StatCard
          icon={FolderOpen}
          label="Toplam Belge"
          value={String(summary.total)}
          description="Kayıtlı belge arşivi"
          variant="blue"
        />
        <StatCard
          icon={Upload}
          label="Bu Ay Yüklenen"
          value={String(summary.monthlyUploads)}
          description="Bu ay yüklenen belgeler"
          variant="green"
        />
        <StatCard
          icon={FileText}
          label="PDF Belgeler"
          value={String(summary.pdfCount)}
          description="PDF formatındaki dosyalar"
          variant="red"
        />
        <StatCard
          icon={File}
          label="Diğer Dosyalar"
          value={String(summary.otherCount)}
          description="PDF dışındaki dosyalar"
          variant="purple"
        />
      </section>

      <DocumentsTable documents={documents} />
    </div>
  );
}
