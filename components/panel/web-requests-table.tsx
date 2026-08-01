"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, FileSearch, Pencil, Search, Trash2 } from "lucide-react";
import {
  ActionModal,
  DetailRow,
  FormField,
  formInputClassName,
  formTextareaClassName,
} from "@/components/panel/action-modal";
import { EmptyState } from "@/components/panel/empty-state";
import { PanelCard } from "@/components/panel/panel-card";
import {
  panelFilterFieldClassName,
  panelFilterGridClassName,
  panelFilterInputClassName,
  panelFilterLabelClassName,
  panelFilterSelectClassName,
  panelMobileCardClassName,
  panelMobileCardLabelClassName,
  panelMobileCardListClassName,
  panelMobileCardValueClassName,
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
  panelTableActionsCellClassName,
  panelTableActionsColClassName,
  panelTableBadgeCellClassName,
  panelTableCellClassName,
  panelTableCheckboxColClassName,
  panelTableClassName,
  panelTableRowClassName,
  panelTableActionsHeadClassName,
  panelTableHeadClassName,
  panelTableHeadRowClassName,
} from "@/components/panel/panel-styles";
import { PanelTableFrame } from "@/components/panel/panel-table-frame";
import { rowActionButtonClassName } from "@/components/panel/row-actions";
import { StatusBadge } from "@/components/panel/status-badge";
import {
  deleteWebRequest,
  deleteWebRequests,
  updateWebRequestStatus,
} from "@/app/(panel)/panel/requests/actions";
import {
  BulkDeleteRecordsButton,
  TableRowCheckbox,
  TableSelectAllCheckbox,
  useTableBulkSelection,
} from "@/components/panel/table-bulk-selection";

export type WebRequestStatus = "new" | "contacted" | "completed" | "cancelled";
export type WebRequestType = "appointment" | "contact" | "info";

export type WebRequestRecord = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  request_type: WebRequestType;
  subject: string | null;
  preferred_branch: string | null;
  message: string | null;
  status: WebRequestStatus;
  status_note: string | null;
  source: string;
};

const requestTypeLabels: Record<WebRequestType, string> = {
  appointment: "Randevu",
  contact: "İletişim",
  info: "Bilgi Talebi",
};

const requestStatusLabels: Record<WebRequestStatus, string> = {
  new: "Yeni",
  contacted: "Görüşüldü",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sameDay(value: string, date: string): boolean {
  if (!date) return true;
  return value.slice(0, 10) === date;
}

type WebRequestActionsProps = {
  request: WebRequestRecord;
  onDeleted?: (ids: string[]) => void;
};

function WebRequestActions({ request, onDeleted }: WebRequestActionsProps) {
  const [activeModal, setActiveModal] = useState<"view" | "edit" | "delete" | null>(
    null,
  );
  const [status, setStatus] = useState<WebRequestStatus>(request.status);
  const [statusNote, setStatusNote] = useState(request.status_note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const closeModal = () => {
    if (isPending) return;
    setError(null);
    setActiveModal(null);
    setStatus(request.status);
    setStatusNote(request.status_note ?? "");
  };

  const handleUpdate = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateWebRequestStatus(
        request.id,
        status,
        statusNote,
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setActiveModal(null);
    });
  };

  const handleDelete = () => {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteWebRequest(request.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setActiveModal(null);
      onDeleted?.([request.id]);
    });
  };

  return (
    <>
      <div className="flex shrink-0 items-center justify-end gap-1">
        <button
          type="button"
          className={rowActionButtonClassName}
          aria-label="Görüntüle"
          title="Görüntüle"
          onClick={() => setActiveModal("view")}
        >
          <Eye className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={rowActionButtonClassName}
          aria-label="Durum güncelle"
          title="Durum güncelle"
          onClick={() => setActiveModal("edit")}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${rowActionButtonClassName} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700`}
          aria-label="Sil"
          title="Sil"
          onClick={() => setActiveModal("delete")}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {activeModal === "view" ? (
        <ActionModal title="Talep Detayı" onClose={closeModal} showPrimary={false}>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <DetailRow label="Ad Soyad" value={request.name} />
            <DetailRow label="Telefon" value={request.phone} />
            <DetailRow label="E-posta" value={request.email || "-"} />
            <DetailRow
              label="Talep Türü"
              value={requestTypeLabels[request.request_type]}
            />
            <DetailRow label="Konu" value={request.subject || "-"} />
            <DetailRow
              label="Tercih Edilen Şube"
              value={request.preferred_branch || "-"}
            />
            <DetailRow
              label="Durum"
              value={requestStatusLabels[request.status]}
            />
            <DetailRow label="Durum Notu" value={request.status_note || "-"} />
            <DetailRow label="Kaynak" value={request.source} />
            <DetailRow label="Mesaj" value={request.message || "-"} />
          </div>
        </ActionModal>
      ) : null}

      {activeModal === "edit" ? (
        <ActionModal
          title="Talep Durumunu Güncelle"
          onClose={closeModal}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            <FormField label="Durum">
              <select
                className={formInputClassName}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as WebRequestStatus)
                }
              >
                <option value="new">Yeni</option>
                <option value="contacted">Görüşüldü</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
              </select>
            </FormField>
            <FormField label="Not">
              <textarea
                className={formTextareaClassName}
                placeholder="Durum güncelleme notu girin."
                value={statusNote}
                onChange={(event) => setStatusNote(event.target.value)}
              />
            </FormField>
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
                onClick={closeModal}
                disabled={isPending}
              >
                İptal
              </button>
              <button
                type="button"
                className={`${panelPrimaryButtonClassName} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70`}
                onClick={handleUpdate}
                disabled={isPending}
              >
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </ActionModal>
      ) : null}

      {activeModal === "delete" ? (
        <ActionModal
          title="Talebi Sil"
          onClose={closeModal}
          showPrimary={false}
          showFooter={false}
          description="Bu talep kalıcı olarak silinecek."
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              {request.name} adına gelen talebi silmek istediğinizden emin
              misiniz?
            </p>
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
                onClick={closeModal}
                disabled={isPending}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold !text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </ActionModal>
      ) : null}
    </>
  );
}

export function WebRequestsTable({
  requests,
}: Readonly<{
  requests: WebRequestRecord[];
}>) {
  const [search, setSearch] = useState("");
  const [requestType, setRequestType] = useState<"all" | WebRequestType>("all");
  const [status, setStatus] = useState<"all" | WebRequestStatus>("all");
  const [date, setDate] = useState("");
  const {
    selectedIds,
    selectedRecords,
    visibleRecords,
    handleRecordsDeleted,
    toggleRecordSelection,
    createSelectionState,
  } = useTableBulkSelection(requests);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

    return visibleRecords.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        [request.name, request.phone, request.subject, request.message]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch);

      const matchesType =
        requestType === "all" || request.request_type === requestType;
      const matchesStatus = status === "all" || request.status === status;
      const matchesDate = sameDay(request.created_at, date);

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [date, requestType, search, status, visibleRecords]);

  const {
    allFilteredSelected,
    someFilteredSelected,
    toggleFilteredSelection,
  } = createSelectionState(filteredRequests);

  return (
    <PanelCard
      title="Talep Listesi"
      description="Web sitesindeki formlardan gelen randevu ve iletişim talepleri."
      action={
        <BulkDeleteRecordsButton
          selectedCount={selectedRecords.length}
          title="Seçili Talepleri Sil"
          description="Bu işlem seçili web taleplerini kalıcı olarak silecek."
          confirmMessage={
            <p className="text-sm leading-6 text-slate-700">
              <strong>{selectedRecords.length}</strong> talebi silmek
              istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
          }
          preview={
            <div className="max-h-48 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              <ul className="space-y-1">
                {selectedRecords.slice(0, 10).map((request) => (
                  <li key={request.id} className="truncate">
                    {request.name} - {request.phone}
                  </li>
                ))}
              </ul>
              {selectedRecords.length > 10 ? (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  ve {selectedRecords.length - 10} kayıt daha...
                </p>
              ) : null}
            </div>
          }
          errorPrefix="Talepler silinemedi"
          successLabel="talep silindi."
          selectedIds={selectedRecords.map((record) => record.id)}
          onDeleted={handleRecordsDeleted}
          onDelete={() =>
            deleteWebRequests(selectedRecords.map((record) => record.id))
          }
        />
      }
    >
      <div className={panelFilterGridClassName}>
        <label className={panelFilterFieldClassName}>
          <span className={panelFilterLabelClassName}>Ara</span>
          <div className="relative min-w-0">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="size-4" aria-hidden="true" />
            </span>
            <input
              type="search"
              placeholder="Ad soyad, telefon, konu veya mesaj"
              className={`${panelFilterInputClassName} pl-9`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </label>

        <label className={panelFilterFieldClassName}>
          <span className={panelFilterLabelClassName}>Talep Türü</span>
          <select
            className={panelFilterSelectClassName}
            value={requestType}
            onChange={(event) =>
              setRequestType(event.target.value as "all" | WebRequestType)
            }
          >
            <option value="all">Tümü</option>
            <option value="appointment">Randevu</option>
            <option value="contact">İletişim</option>
            <option value="info">Bilgi Talebi</option>
          </select>
        </label>

        <label className={panelFilterFieldClassName}>
          <span className={panelFilterLabelClassName}>Durum</span>
          <select
            className={panelFilterSelectClassName}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | WebRequestStatus)
            }
          >
            <option value="all">Tümü</option>
            <option value="new">Yeni</option>
            <option value="contacted">Görüşüldü</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </label>

        <label className={panelFilterFieldClassName}>
          <span className={panelFilterLabelClassName}>Tarih</span>
          <input
            type="date"
            className={panelFilterInputClassName}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </div>

      {filteredRequests.length > 0 ? (
        <>
          <div className={panelMobileCardListClassName}>
            {filteredRequests.map((request) => (
              <article
                key={`mobile-${request.id}`}
                className={panelMobileCardClassName}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-bold text-slate-950">
                      {request.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(request.created_at)} · {formatTime(request.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <dl className="mt-3 grid gap-2">
                  <div>
                    <dt className={panelMobileCardLabelClassName}>Konu</dt>
                    <dd className="break-words text-sm font-semibold text-slate-950">
                      {request.subject || "-"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className={panelMobileCardLabelClassName}>Telefon</dt>
                      <dd className={panelMobileCardValueClassName}>
                        {request.phone}
                      </dd>
                    </div>
                    <div>
                      <dt className={panelMobileCardLabelClassName}>Tür</dt>
                      <dd className={panelMobileCardValueClassName}>
                        {requestTypeLabels[request.request_type]}
                      </dd>
                    </div>
                  </div>
                </dl>
                <div className="mt-3">
                  <WebRequestActions
                    request={request}
                    onDeleted={handleRecordsDeleted}
                  />
                </div>
              </article>
            ))}
          </div>

          <PanelTableFrame>
            <table className={panelTableClassName}>
              <colgroup>
                <col className={panelTableCheckboxColClassName} />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col className={panelTableActionsColClassName} />
              </colgroup>
              <thead>
                <tr className={panelTableHeadRowClassName}>
                  <th className={panelTableHeadClassName}>
                    <TableSelectAllCheckbox
                      allSelected={allFilteredSelected}
                      someSelected={someFilteredSelected}
                      onToggle={toggleFilteredSelection}
                    />
                  </th>
                  <th className={panelTableHeadClassName}>Tarih</th>
                  <th className={panelTableHeadClassName}>Ad Soyad</th>
                  <th className={panelTableHeadClassName}>Telefon</th>
                  <th className={panelTableHeadClassName}>E-posta</th>
                  <th className={panelTableHeadClassName}>Talep Türü</th>
                  <th className={panelTableHeadClassName}>Konu</th>
                  <th className={panelTableHeadClassName}>Tercih Edilen Şube</th>
                  <th className={panelTableHeadClassName}>Durum</th>
                  <th className={panelTableHeadClassName}>Mesaj</th>
                  <th className={panelTableActionsHeadClassName}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className={panelTableRowClassName}>
                    <td className={panelTableCellClassName}>
                      <TableRowCheckbox
                        checked={selectedIds.has(request.id)}
                        label={`${request.name} talebini seç`}
                        onToggle={() => toggleRecordSelection(request.id)}
                      />
                    </td>
                    <td
                      className={panelTableCellClassName}
                      title={`${formatDate(request.created_at)} ${formatTime(request.created_at)}`}
                    >
                      {formatDate(request.created_at)}
                    </td>
                    <td
                      className={`${panelTableCellClassName} font-semibold text-slate-950`}
                      title={request.name}
                    >
                      {request.name}
                    </td>
                    <td
                      className={panelTableCellClassName}
                      title={request.phone}
                    >
                      {request.phone}
                    </td>
                    <td
                      className={panelTableCellClassName}
                      title={request.email || undefined}
                    >
                      {request.email || "-"}
                    </td>
                    <td className={panelTableCellClassName}>
                      {requestTypeLabels[request.request_type]}
                    </td>
                    <td
                      className={`${panelTableCellClassName} font-semibold text-slate-950`}
                      title={request.subject || undefined}
                    >
                      {request.subject || "-"}
                    </td>
                    <td
                      className={panelTableCellClassName}
                      title={request.preferred_branch || undefined}
                    >
                      {request.preferred_branch || "-"}
                    </td>
                    <td className={panelTableBadgeCellClassName}>
                      <StatusBadge status={request.status} />
                    </td>
                    <td
                      className={panelTableCellClassName}
                      title={request.message || undefined}
                    >
                      {request.message || "-"}
                    </td>
                    <td className={panelTableActionsCellClassName}>
                      <WebRequestActions
                        request={request}
                        onDeleted={handleRecordsDeleted}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PanelTableFrame>
        </>
      ) : (
        <EmptyState
          icon={FileSearch}
          title="Talep bulunamadı"
          description="Seçili filtrelerle eşleşen talep kaydı yok."
        />
      )}
    </PanelCard>
  );
}
