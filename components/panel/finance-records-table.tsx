"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  FileSearch,
  MinusCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  createFinanceRecord,
  deleteFinanceRecord,
  deleteFinanceRecords,
  updateFinanceRecord,
  type FinanceActionResult,
} from "@/app/(panel)/panel/income-expense/actions";
import { PanelLink } from "@/components/panel/panel-link";
import { PanelPendingSubmitButton } from "@/components/panel/panel-pending-submit-button";
import {
  ActionModal,
  FormField,
  formInputClassName,
  formTextareaClassName,
} from "@/components/panel/action-modal";
import { EmptyState } from "@/components/panel/empty-state";
import { PanelCard } from "@/components/panel/panel-card";
import { getFormRestoreKey } from "@/lib/panel-form";
import {
  BulkDeleteRecordsButton,
  TableRowCheckbox,
  TableSelectAllCheckbox,
  useTableBulkSelection,
} from "@/components/panel/table-bulk-selection";
import {
  panelFilterFieldClassName,
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
  panelTableActionsHeadClassName,
  panelTableCellClassName,
  panelTableClassName,
  panelTableDesktopClassName,
  panelTableHeadClassName,
  panelTableHeadRowClassName,
  panelTableRowClassName,
  panelTableScrollClassName,
} from "@/components/panel/panel-styles";
import { rowActionButtonClassName } from "@/components/panel/row-actions";
import {
  financeEntryFilterOptions,
  financeEntrySourceLabels,
  financePaymentMethodLabels,
  financePaymentMethodOptions,
  filterUnifiedFinanceEntries,
  type FinanceEntryFilterType,
  type FinanceEntrySource,
  type FinancePaymentMethod,
  type FinanceRecord,
  type UnifiedFinanceEntry,
} from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/transactions";

type RecordModalType = "income" | "expense";

type FinanceRecordFormProps = {
  type: RecordModalType;
  record?: FinanceRecord;
  onClose: () => void;
};

function FinanceRecordForm({ type, record, onClose }: FinanceRecordFormProps) {
  const action = record ? updateFinanceRecord : createFinanceRecord;
  const [state, formAction] = useActionState<
    FinanceActionResult | undefined,
    FormData
  >(action, undefined);
  const values = state && !state.ok ? state.values : undefined;
  const formRestoreKey = getFormRestoreKey(values);

  useEffect(() => {
    if (state?.ok) {
      onClose();
      // revalidatePath on the server action already refreshes this route.
    }
  }, [onClose, state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form key={formRestoreKey} action={formAction} className="grid gap-4 sm:grid-cols-2">
      {record ? <input type="hidden" name="id" value={record.id} /> : null}
      <input type="hidden" name="type" value={record?.type ?? type} />

      <FormField label="Tarih">
        <input
          type="date"
          name="record_date"
          className={formInputClassName}
          defaultValue={values?.record_date ?? record?.record_date ?? today}
          required
        />
      </FormField>

      <FormField label="Ödeme yöntemi">
        <select
          name="payment_method"
          className={formInputClassName}
          defaultValue={values?.payment_method ?? record?.payment_method ?? ""}
          required
        >
          <option value="" disabled>
            Ödeme yöntemi seçin
          </option>
          {financePaymentMethodOptions.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Tutar">
        <input
          type="text"
          name="amount"
          inputMode="decimal"
          className={formInputClassName}
          defaultValue={
            values?.amount ?? (record ? String(record.amount) : "")
          }
          placeholder="Örn. 1250"
          required
        />
      </FormField>

      <FormField label="İlgilenen personel">
        <input
          type="text"
          name="responsible_person"
          className={formInputClassName}
          defaultValue={
            values?.responsible_person ?? record?.responsible_person ?? ""
          }
          placeholder="Örn. Admin Kullanıcı"
        />
      </FormField>

      <div className="sm:col-span-2">
        <FormField label="Açıklama">
          <textarea
            name="description"
            className={formTextareaClassName}
            defaultValue={values?.description ?? record?.description ?? ""}
            placeholder="Kayıt hakkında kısa not ekleyin."
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
          idleLabel={
            record
              ? "Kaydet"
              : type === "income"
                ? "Geliri Kaydet"
                : "Gideri Kaydet"
          }
          pendingLabel="Kaydediliyor..."
        />
      </div>
    </form>
  );
}

function SourceBadge({ source }: Readonly<{ source: FinanceEntrySource }>) {
  const styles: Record<FinanceEntrySource, string> = {
    patient_payment: "border-sky-200 bg-sky-50 text-sky-700",
    manual_income: "border-emerald-200 bg-emerald-50 text-emerald-700",
    manual_expense: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles[source]}`}
    >
      {financeEntrySourceLabels[source]}
    </span>
  );
}

function DeleteFinanceRecordButton({
  record,
  onDeleted,
}: Readonly<{ record: FinanceRecord; onDeleted: (ids: string[]) => void }>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteFinanceRecord(record.id);

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
          title="Kaydı Sil"
          description="Bu gelir/gider kaydı kalıcı olarak silinecek."
          onClose={() => setIsOpen(false)}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              <strong>{formatDate(record.record_date)}</strong> tarihli{" "}
              <strong>
                {record.type === "income" ? "gelir" : "gider"}
              </strong>{" "}
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

export function FinanceRecordsTable({
  entries,
}: Readonly<{ entries: UnifiedFinanceEntry[] }>) {
  const [filterDate, setFilterDate] = useState("");
  const [entryType, setEntryType] = useState<FinanceEntryFilterType>("all");
  const [paymentMethod, setPaymentMethod] = useState<
    "all" | FinancePaymentMethod
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalType, setCreateModalType] = useState<RecordModalType | null>(
    null,
  );
  const [editRecord, setEditRecord] = useState<FinanceRecord | null>(null);
  const deletableRecords = useMemo(
    () =>
      entries
        .filter((entry) => entry.financeRecord)
        .map((entry) => entry.financeRecord!),
    [entries],
  );
  const {
    selectedIds,
    selectedRecords,
    visibleRecords: visibleDeletableRecords,
    handleRecordsDeleted,
    toggleRecordSelection,
    createSelectionState,
  } = useTableBulkSelection(deletableRecords);
  const locallyDeletedFinanceIds = useMemo(() => {
    const visibleIds = new Set(visibleDeletableRecords.map((record) => record.id));
    return new Set(
      deletableRecords
        .map((record) => record.id)
        .filter((id) => !visibleIds.has(id)),
    );
  }, [deletableRecords, visibleDeletableRecords]);

  const visibleEntries = useMemo(
    () =>
      entries.filter((entry) => {
        if (!entry.financeRecord) {
          return true;
        }

        return !locallyDeletedFinanceIds.has(entry.financeRecord.id);
      }),
    [entries, locallyDeletedFinanceIds],
  );

  const filteredEntries = useMemo(() => {
    return filterUnifiedFinanceEntries(visibleEntries, {
      filterDate,
      entryType,
      paymentMethod,
      searchQuery,
    });
  }, [entryType, filterDate, paymentMethod, searchQuery, visibleEntries]);

  const filteredDeletableRecords = useMemo(
    () =>
      filteredEntries
        .filter((entry) => entry.financeRecord)
        .map((entry) => entry.financeRecord!),
    [filteredEntries],
  );
  const {
    allFilteredSelected,
    someFilteredSelected,
    toggleFilteredSelection,
  } = createSelectionState(filteredDeletableRecords);

  return (
    <>
      <PanelCard
        title="Gelir - Gider Kayıtları"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
            <BulkDeleteRecordsButton
              selectedCount={selectedRecords.length}
              title="Seçili Kayıtları Sil"
              description="Bu işlem seçili manuel gelir/gider kayıtlarını kalıcı olarak silecek."
              confirmMessage={
                <p className="text-sm leading-6 text-slate-700">
                  <strong>{selectedRecords.length}</strong> manuel kaydı silmek
                  istediğinizden emin misiniz? Hasta tahsilatları bu işlemden
                  etkilenmez.
                </p>
              }
              preview={
                <div className="max-h-48 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                  <ul className="space-y-1">
                    {selectedRecords.slice(0, 10).map((record) => (
                      <li key={record.id} className="truncate">
                        {formatDate(record.record_date)} -{" "}
                        {record.type === "income" ? "Gelir" : "Gider"} -{" "}
                        {formatCurrency(record.amount)}
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
              errorPrefix="Kayıtlar silinemedi"
              successLabel="kayıt silindi."
              selectedIds={selectedRecords.map((record) => record.id)}
              onDeleted={handleRecordsDeleted}
              onDelete={() =>
                deleteFinanceRecords(selectedRecords.map((record) => record.id))
              }
            />
            <button
              type="button"
              onClick={() => setCreateModalType("income")}
              className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Gelir Ekle
            </button>
            <button
              type="button"
              onClick={() => setCreateModalType("expense")}
              className={`${panelSecondaryButtonClassName} w-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 sm:w-auto`}
            >
              <MinusCircle className="size-4" aria-hidden="true" />
              Gider Ekle
            </button>
          </div>
        }
      >
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Tarih</span>
            <input
              type="date"
              className={panelFilterInputClassName}
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
            />
          </label>

          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Kayıt Tipi</span>
            <select
              className={panelFilterSelectClassName}
              value={entryType}
              onChange={(event) =>
                setEntryType(event.target.value as FinanceEntryFilterType)
              }
            >
              {financeEntryFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Ödeme Yöntemi</span>
            <select
              className={panelFilterSelectClassName}
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value as "all" | FinancePaymentMethod,
                )
              }
            >
              <option value="all">Tümü</option>
              {financePaymentMethodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </label>

          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Ara</span>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                className={`${panelFilterInputClassName} pl-9`}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Hasta, işlem no, açıklama..."
              />
            </div>
          </label>
        </div>

        {filteredEntries.length > 0 ? (
          <>
            <div className={panelMobileCardListClassName}>
              {filteredEntries.map((entry) => (
                <article
                  key={`mobile-${entry.source}-${entry.id}`}
                  className={panelMobileCardClassName}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold text-slate-950">
                        {entry.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(entry.recordDate)}
                      </p>
                    </div>
                    <SourceBadge source={entry.source} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <dt className={panelMobileCardLabelClassName}>Tutar</dt>
                      <dd
                        className={`${panelMobileCardValueClassName} tabular-nums`}
                      >
                        {formatCurrency(entry.amount)}
                      </dd>
                    </div>
                    <div>
                      <dt className={panelMobileCardLabelClassName}>
                        Ödeme Yöntemi
                      </dt>
                      <dd className={panelMobileCardValueClassName}>
                        {financePaymentMethodLabels[entry.paymentMethod]}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className={panelMobileCardLabelClassName}>
                        İlgilenen Personel
                      </dt>
                      <dd className={`${panelMobileCardValueClassName} break-words`}>
                        {entry.responsiblePerson || "-"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.source === "patient_payment" &&
                    entry.transactionId ? (
                      <PanelLink
                        href={`/panel/transactions/${entry.transactionId}`}
                        className={`${panelPrimaryButtonClassName} min-h-11 flex-1`}
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                        İşleme Git
                      </PanelLink>
                    ) : entry.financeRecord ? (
                      <>
                        <button
                          type="button"
                          className={`${panelSecondaryButtonClassName} min-h-11 flex-1`}
                          onClick={() => setEditRecord(entry.financeRecord!)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          Düzenle
                        </button>
                        <DeleteFinanceRecordButton
                          record={entry.financeRecord}
                          onDeleted={handleRecordsDeleted}
                        />
                      </>
                    ) : null}
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
                      <TableSelectAllCheckbox
                        allSelected={allFilteredSelected}
                        someSelected={someFilteredSelected}
                        onToggle={toggleFilteredSelection}
                        label="Filtrelenen manuel kayıtları seç"
                      />
                    </th>
                    <th className={`${panelTableHeadClassName} w-[7rem]`}>Tarih</th>
                    <th className={`${panelTableHeadClassName} w-[8.5rem]`}>
                      Kaynak / Tip
                    </th>
                    <th className={`${panelTableHeadClassName} w-[7.5rem]`}>
                      Ödeme Yöntemi
                    </th>
                    <th className={`${panelTableHeadClassName} w-[7rem] text-right`}>
                      Tutar
                    </th>
                    <th className={`${panelTableHeadClassName} hidden xl:table-cell`}>
                      İlgilenen Personel
                    </th>
                    <th className={panelTableHeadClassName}>Açıklama</th>
                    <th className={panelTableActionsHeadClassName}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr
                      key={`${entry.source}-${entry.id}`}
                      className={panelTableRowClassName}
                    >
                      <td className={panelTableCellClassName}>
                        {entry.financeRecord ? (
                          <TableRowCheckbox
                            checked={selectedIds.has(entry.financeRecord.id)}
                            label={`${entry.description} kaydını seç`}
                            onToggle={() =>
                              toggleRecordSelection(entry.financeRecord!.id)
                            }
                          />
                        ) : null}
                      </td>
                      <td className={`${panelTableCellClassName} whitespace-nowrap`}>
                        {formatDate(entry.recordDate)}
                      </td>
                      <td className={panelTableCellClassName}>
                        <SourceBadge source={entry.source} />
                      </td>
                      <td
                        className={`${panelTableCellClassName} truncate`}
                        title={financePaymentMethodLabels[entry.paymentMethod]}
                      >
                        {financePaymentMethodLabels[entry.paymentMethod]}
                      </td>
                      <td className={`${panelTableCellClassName} whitespace-nowrap text-right font-semibold tabular-nums text-slate-950`}>
                        {formatCurrency(entry.amount)}
                      </td>
                      <td
                        className={`${panelTableCellClassName} hidden min-w-0 truncate xl:table-cell`}
                        title={entry.responsiblePerson || undefined}
                      >
                        {entry.responsiblePerson || "-"}
                      </td>
                      <td
                        className={`${panelTableCellClassName} min-w-0 truncate`}
                        title={entry.description}
                      >
                        {entry.description}
                      </td>
                      <td className={panelTableActionsCellClassName}>
                        {entry.source === "patient_payment" &&
                        entry.transactionId ? (
                          <div className="flex shrink-0 items-center justify-end">
                            <PanelLink
                              href={`/panel/transactions/${entry.transactionId}`}
                              className={rowActionButtonClassName}
                              aria-label="İşleme Git"
                              title="İşleme Git"
                            >
                              <ExternalLink
                                className="size-4"
                                aria-hidden="true"
                              />
                            </PanelLink>
                          </div>
                        ) : entry.financeRecord ? (
                          <div className="flex shrink-0 items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className={rowActionButtonClassName}
                              aria-label="Düzenle"
                              title="Düzenle"
                              onClick={() => setEditRecord(entry.financeRecord!)}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </button>
                            <DeleteFinanceRecordButton
                              record={entry.financeRecord}
                              onDeleted={handleRecordsDeleted}
                            />
                          </div>
                        ) : null}
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
            title="Kayıt bulunamadı"
            description="Seçili filtrelerle eşleşen gelir, gider veya hasta tahsilatı kaydı yok."
          />
        )}
      </PanelCard>

      {createModalType ? (
        <ActionModal
          title={createModalType === "income" ? "Gelir Ekle" : "Gider Ekle"}
          description={
            createModalType === "income"
              ? "Manuel gelir kaydı oluşturun."
              : "Manuel gider kaydı oluşturun."
          }
          onClose={() => setCreateModalType(null)}
          showPrimary={false}
          showFooter={false}
        >
          <FinanceRecordForm
            type={createModalType}
            onClose={() => setCreateModalType(null)}
          />
        </ActionModal>
      ) : null}

      {editRecord ? (
        <ActionModal
          title={
            editRecord.type === "income"
              ? "Gelir Kaydını Düzenle"
              : "Gider Kaydını Düzenle"
          }
          description="Kayıt bilgilerini güncelleyin."
          onClose={() => setEditRecord(null)}
          showPrimary={false}
          showFooter={false}
        >
          <FinanceRecordForm
            type={editRecord.type}
            record={editRecord}
            onClose={() => setEditRecord(null)}
          />
        </ActionModal>
      ) : null}
    </>
  );
}
