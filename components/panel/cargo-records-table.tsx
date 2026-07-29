"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { FileSearch, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createCargoRecord,
  deleteCargoRecord,
  deleteCargoRecords,
  updateCargoRecord,
  type CargoActionResult,
} from "@/app/(panel)/panel/cargo/actions";
import {
  ActionModal,
  FormField,
  formInputClassName,
  formTextareaClassName,
} from "@/components/panel/action-modal";
import { EmptyState } from "@/components/panel/empty-state";
import { PanelCard } from "@/components/panel/panel-card";
import { PanelPendingSubmitButton } from "@/components/panel/panel-pending-submit-button";
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
  panelTableCellClassName,
  panelTableClassName,
  panelTableDesktopClassName,
  panelTableRowClassName,
  panelTableActionsHeadClassName,
  panelTableHeadClassName,
  panelTableHeadRowClassName,
  panelTableScrollClassName,
} from "@/components/panel/panel-styles";
import { rowActionButtonClassName } from "@/components/panel/row-actions";
import { StatusBadge } from "@/components/panel/status-badge";
import {
  cargoStatusOptions,
  type CargoRecord,
  type CargoStatus,
} from "@/lib/cargo";
import { getFormRestoreKey } from "@/lib/panel-form";
import { formatDate } from "@/lib/transactions";

type CargoRecordFormProps = {
  record?: CargoRecord;
  onClose: () => void;
};

function CargoRecordForm({ record, onClose }: CargoRecordFormProps) {
  const action = record ? updateCargoRecord : createCargoRecord;
  const [state, formAction] = useActionState<
    CargoActionResult | undefined,
    FormData
  >(action, undefined);
  const values = state && !state.ok ? state.values : undefined;
  const formRestoreKey = getFormRestoreKey(values);

  useEffect(() => {
    if (state?.ok) {
      onClose();
    }
  }, [onClose, state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form key={formRestoreKey} action={formAction} className="grid gap-4 sm:grid-cols-2">
      {record ? <input type="hidden" name="id" value={record.id} /> : null}

      <FormField label="Tarih">
        <input
          type="date"
          name="cargo_date"
          className={formInputClassName}
          defaultValue={values?.cargo_date ?? record?.cargo_date ?? today}
          required
        />
      </FormField>

      <FormField label="Gönderen">
        <input
          type="text"
          name="sender_name"
          className={formInputClassName}
          defaultValue={values?.sender_name ?? record?.sender_name ?? ""}
          placeholder="Örn. Admin Kullanıcı"
          required
        />
      </FormField>

      <div className="sm:col-span-2">
        <FormField label="Yapılan işlem">
          <input
            type="text"
            name="process_description"
            className={formInputClassName}
            defaultValue={
              values?.process_description ?? record?.process_description ?? ""
            }
            placeholder="Örn. Cihaz servise gönderim"
            required
          />
        </FormField>
      </div>

      <FormField label="Kargo firması">
        <input
          type="text"
          name="cargo_company"
          className={formInputClassName}
          defaultValue={values?.cargo_company ?? record?.cargo_company ?? ""}
          placeholder="Örn. Yurtiçi, Aras, MNG"
          required
        />
      </FormField>

      <FormField label="Kargo şubesi">
        <input
          type="text"
          name="cargo_branch"
          className={formInputClassName}
          defaultValue={values?.cargo_branch ?? record?.cargo_branch ?? ""}
          placeholder="Örn. Asi Köprüsü Aras Kargo Şubesi"
        />
      </FormField>

      <FormField label="Takip numarası">
        <input
          type="text"
          name="tracking_number"
          className={formInputClassName}
          defaultValue={values?.tracking_number ?? record?.tracking_number ?? ""}
          placeholder="Örn. YK245781902"
        />
      </FormField>

      <FormField label="Durum">
        <select
          name="status"
          className={formInputClassName}
          defaultValue={values?.status ?? record?.status ?? "prepared"}
          required
        >
          {cargoStatusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="sm:col-span-2">
        <FormField label="Not">
          <textarea
            name="note"
            className={formTextareaClassName}
            defaultValue={values?.note ?? record?.note ?? ""}
            placeholder="Kargo kaydı hakkında kısa not ekleyin."
          />
        </FormField>
      </div>

      {state && !state.ok ? (
        <p className="sm:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}

      <div className="sm:col-span-2 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
        >
          İptal
        </button>
        <PanelPendingSubmitButton
          className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
          idleLabel={record ? "Kaydet" : "Kargoyu Kaydet"}
          pendingLabel="Kaydediliyor..."
        />
      </div>
    </form>
  );
}

function DeleteCargoRecordButton({
  record,
  onDeleted,
}: Readonly<{ record: CargoRecord; onDeleted: (ids: string[]) => void }>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteCargoRecord(record.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      onDeleted([record.id]);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        className={rowActionButtonClassName}
        aria-label="Sil"
        title="Sil"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>

      {isOpen ? (
        <ActionModal
          title="Kargo Kaydını Sil"
          description="Bu kargo kaydı kalıcı olarak silinecek."
          onClose={() => setIsOpen(false)}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              <strong>{record.tracking_number || record.process_description}</strong>{" "}
              kaydını silmek istediğinizden emin misiniz?
            </p>
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
                disabled={isPending}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold !text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
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

function BulkDeleteCargoRecordsButton({
  selectedRecords,
  onDeleted,
}: Readonly<{
  selectedRecords: CargoRecord[];
  onDeleted: (ids: string[]) => void;
}>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const idsToDelete = selectedRecords.map((record) => record.id);
      const result = await deleteCargoRecords(idsToDelete);

      if (!result.ok) {
        const partialMessage =
          result.deletedCount && result.deletedCount > 0
            ? ` ${result.deletedCount} kayıt silindi; liste yenileniyor.`
            : "";
        setError(`Kargo kayıtları silinemedi: ${result.error}${partialMessage}`);
        if (result.deletedCount && result.deletedCount > 0) {
          router.refresh();
        }
        return;
      }

      setIsOpen(false);
      setSuccessMessage(
        `${result.deletedCount ?? idsToDelete.length} kargo kaydı silindi.`,
      );
      onDeleted(idsToDelete);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setSuccessMessage(null);
          setIsOpen(true);
        }}
        disabled={selectedRecords.length === 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Seçilenleri Sil ({selectedRecords.length})
      </button>
      {successMessage ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      {isOpen ? (
        <ActionModal
          title="Seçili Kargo Kayıtlarını Sil"
          description="Bu işlem seçili kargo kayıtlarını kalıcı olarak silecek."
          onClose={() => {
            if (!isPending) {
              setIsOpen(false);
            }
          }}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              <strong>{selectedRecords.length}</strong> kargo kaydını silmek
              istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="max-h-48 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              <ul className="space-y-1">
                {selectedRecords.slice(0, 10).map((record) => (
                  <li key={record.id} className="truncate">
                    {formatDate(record.cargo_date)} - {record.sender_name} -{" "}
                    {record.process_description}
                  </li>
                ))}
              </ul>
              {selectedRecords.length > 10 ? (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  ve {selectedRecords.length - 10} kayıt daha...
                </p>
              ) : null}
            </div>
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
                disabled={isPending}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold !text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isPending ? "Siliniyor..." : "Seçilenleri Sil"}
              </button>
            </div>
          </div>
        </ActionModal>
      ) : null}
    </>
  );
}

export function CargoRecordsTable({
  records,
}: Readonly<{ records: CargoRecord[] }>) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | CargoStatus>("all");
  const [cargoCompany, setCargoCompany] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<CargoRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(
    new Set(),
  );

  const visibleRecords = useMemo(
    () => records.filter((record) => !locallyDeletedIds.has(record.id)),
    [locallyDeletedIds, records],
  );

  const companyOptions = useMemo(() => {
    const companies = new Set(
      visibleRecords.map((record) => record.cargo_company).filter(Boolean),
    );

    return Array.from(companies).sort((a, b) =>
      a.localeCompare(b, "tr-TR"),
    );
  }, [visibleRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

    return visibleRecords.filter((record) => {
      const searchableText = [
        record.tracking_number,
        record.sender_name,
        record.process_description,
        record.cargo_company,
        record.cargo_branch,
        record.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesStatus = status === "all" || record.status === status;
      const matchesCompany =
        cargoCompany === "all" || record.cargo_company === cargoCompany;
      const matchesDate = !filterDate || record.cargo_date === filterDate;

      return matchesSearch && matchesStatus && matchesCompany && matchesDate;
    });
  }, [cargoCompany, filterDate, search, status, visibleRecords]);

  const selectedRecords = useMemo(
    () => visibleRecords.filter((record) => selectedIds.has(record.id)),
    [selectedIds, visibleRecords],
  );
  const filteredIds = useMemo(
    () => filteredRecords.map((record) => record.id),
    [filteredRecords],
  );
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  const handleRecordsDeleted = (ids: string[]) => {
    setLocallyDeletedIds((current) => new Set([...current, ...ids]));
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleRecordSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFilteredSelection = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        for (const id of filteredIds) {
          next.delete(id);
        }
      } else {
        for (const id of filteredIds) {
          next.add(id);
        }
      }
      return next;
    });
  };

  return (
    <>
      <PanelCard
        title="Kargo Kayıtları"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <BulkDeleteCargoRecordsButton
              selectedRecords={selectedRecords}
              onDeleted={handleRecordsDeleted}
            />
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Yeni Kargo
            </button>
          </div>
        }
      >
        <div className={panelFilterGridClassName}>
          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Ara</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="size-4" aria-hidden="true" />
              </span>
              <input
                type="search"
                placeholder="Takip no, gönderen veya işlem"
                className={`${panelFilterInputClassName} pl-9`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>

          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Durum</span>
            <select
              className={panelFilterSelectClassName}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | CargoStatus)
              }
            >
              <option value="all">Tümü</option>
              {cargoStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Kargo Firması</span>
            <select
              className={panelFilterSelectClassName}
              value={cargoCompany}
              onChange={(event) => setCargoCompany(event.target.value)}
            >
              <option value="all">Tümü</option>
              {companyOptions.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </label>

          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Tarih</span>
            <input
              type="date"
              className={panelFilterInputClassName}
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
            />
          </label>
        </div>

        {filteredRecords.length > 0 ? (
          <>
            <div className={panelMobileCardListClassName}>
              {filteredRecords.map((record) => (
                <article
                  key={`mobile-${record.id}`}
                  className={panelMobileCardClassName}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold text-slate-950">
                        {record.sender_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(record.cargo_date)}
                        {" · "}
                        {record.cargo_company}
                      </p>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <dt className={panelMobileCardLabelClassName}>
                        Yapılan İşlem
                      </dt>
                      <dd
                        className={`${panelMobileCardValueClassName} break-words`}
                      >
                        {record.process_description}
                      </dd>
                    </div>
                    <div>
                      <dt className={panelMobileCardLabelClassName}>
                        Takip No
                      </dt>
                      <dd
                        className={`${panelMobileCardValueClassName} break-all font-mono text-xs`}
                      >
                        {record.tracking_number || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className={panelMobileCardLabelClassName}>
                        Kargo Şubesi
                      </dt>
                      <dd
                        className={`${panelMobileCardValueClassName} break-words`}
                      >
                        {record.cargo_branch || "-"}
                      </dd>
                    </div>
                    {record.note ? (
                      <div className="col-span-2">
                        <dt className={panelMobileCardLabelClassName}>Not</dt>
                        <dd
                          className={`${panelMobileCardValueClassName} break-words font-normal text-slate-700`}
                        >
                          {record.note}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`${panelSecondaryButtonClassName} min-h-11 flex-1`}
                      onClick={() => setEditRecord(record)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      Düzenle
                    </button>
                    <DeleteCargoRecordButton
                      record={record}
                      onDeleted={handleRecordsDeleted}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div
              className={`${panelTableScrollClassName} ${panelTableDesktopClassName}`}
            >
              <table className={panelTableClassName}>
                <thead>
                  <tr className={panelTableHeadRowClassName}>
                    <th className={`${panelTableHeadClassName} w-10`}>
                      <input
                        type="checkbox"
                        aria-label="Filtrelenen kayıtları seç"
                        checked={allFilteredSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate =
                              someFilteredSelected && !allFilteredSelected;
                          }
                        }}
                        onChange={toggleFilteredSelection}
                        className="size-5 min-h-5 min-w-5 rounded border-slate-300 text-sky-700 focus:ring-sky-200"
                      />
                    </th>
                    <th className={`${panelTableHeadClassName} w-[6.5rem]`}>Tarih</th>
                    <th className={panelTableHeadClassName}>Gönderen</th>
                    <th className={panelTableHeadClassName}>Yapılan İşlem</th>
                    <th className={`${panelTableHeadClassName} w-[8rem]`}>
                      Kargo Firması
                    </th>
                    <th className={`${panelTableHeadClassName} hidden xl:table-cell`}>
                      Kargo Şubesi
                    </th>
                    <th className={`${panelTableHeadClassName} w-[8rem]`}>
                      Takip No
                    </th>
                    <th className={`${panelTableHeadClassName} w-[6.5rem]`}>Durum</th>
                    <th className={`${panelTableHeadClassName} hidden xl:table-cell`}>
                      Not
                    </th>
                    <th className={panelTableActionsHeadClassName}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className={panelTableRowClassName}>
                      <td className={panelTableCellClassName}>
                        <input
                          type="checkbox"
                          aria-label={`${record.sender_name} kaydını seç`}
                          checked={selectedIds.has(record.id)}
                          onChange={() => toggleRecordSelection(record.id)}
                          className="size-5 min-h-5 min-w-5 rounded border-slate-300 text-sky-700 focus:ring-sky-200"
                        />
                      </td>
                      <td className={`${panelTableCellClassName} whitespace-nowrap`}>
                        {formatDate(record.cargo_date)}
                      </td>
                      <td
                        className={`${panelTableCellClassName} min-w-0 truncate`}
                        title={record.sender_name}
                      >
                        {record.sender_name}
                      </td>
                      <td
                        className={`${panelTableCellClassName} min-w-0 truncate font-semibold text-slate-950`}
                        title={record.process_description}
                      >
                        {record.process_description}
                      </td>
                      <td
                        className={`${panelTableCellClassName} truncate`}
                        title={record.cargo_company}
                      >
                        {record.cargo_company}
                      </td>
                      <td
                        className={`${panelTableCellClassName} hidden truncate xl:table-cell`}
                        title={record.cargo_branch || undefined}
                      >
                        {record.cargo_branch || "-"}
                      </td>
                      <td
                        className={`${panelTableCellClassName} truncate font-mono text-xs font-semibold text-slate-950`}
                        title={record.tracking_number || undefined}
                      >
                        {record.tracking_number || "-"}
                      </td>
                      <td className={panelTableCellClassName}>
                        <StatusBadge status={record.status} />
                      </td>
                      <td
                        className={`${panelTableCellClassName} hidden min-w-0 truncate xl:table-cell`}
                        title={record.note || undefined}
                      >
                        {record.note || "-"}
                      </td>
                      <td className={panelTableActionsCellClassName}>
                        <div className="flex shrink-0 items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className={rowActionButtonClassName}
                            aria-label="Düzenle"
                            title="Düzenle"
                            onClick={() => setEditRecord(record)}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </button>
                          <DeleteCargoRecordButton
                            record={record}
                            onDeleted={handleRecordsDeleted}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState
            icon={FileSearch}
            title="Kargo kaydı bulunamadı"
            description="Seçili filtrelerle eşleşen kargo kaydı yok."
          />
        )}
      </PanelCard>

      {isCreateOpen ? (
        <ActionModal
          title="Yeni Kargo Kaydı"
          description="Kargo gönderim kaydı oluşturun."
          onClose={() => setIsCreateOpen(false)}
          showPrimary={false}
          showFooter={false}
        >
          <CargoRecordForm onClose={() => setIsCreateOpen(false)} />
        </ActionModal>
      ) : null}

      {editRecord ? (
        <ActionModal
          title="Kargo Kaydını Güncelle"
          description="Kargo bilgilerini güncelleyin."
          onClose={() => setEditRecord(null)}
          showPrimary={false}
          showFooter={false}
        >
          <CargoRecordForm
            record={editRecord}
            onClose={() => setEditRecord(null)}
          />
        </ActionModal>
      ) : null}
    </>
  );
}
