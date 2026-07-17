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
  createReminderAction,
  deleteReminderAction,
  deleteReminderRecords,
  updateReminderAction,
  type ReminderActionResult,
} from "@/app/(panel)/panel/reminders/actions";
import {
  ActionModal,
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
  panelTableActionsHeadClassName,
  panelTableDesktopClassName,
  panelTableScrollClassName,
} from "@/components/panel/panel-styles";
import { rowActionButtonClassName } from "@/components/panel/row-actions";
import { StatusBadge } from "@/components/panel/status-badge";
import {
  formatReminderTime,
  isOverdueReminder,
  reminderStatusOptions,
  type ReminderRecord,
  type ReminderStatus,
} from "@/lib/reminders";
import { getFormRestoreKey } from "@/lib/panel-form";
import {
  BulkDeleteRecordsButton,
  TableRowCheckbox,
  TableSelectAllCheckbox,
  useTableBulkSelection,
} from "@/components/panel/table-bulk-selection";
import { formatDate } from "@/lib/transactions";

type ReminderFormProps = {
  reminder?: ReminderRecord;
  onClose: () => void;
};

function ReminderDateText({
  reminder,
  variant = "table",
}: Readonly<{ reminder: ReminderRecord; variant?: "table" | "mobile" }>) {
  const overdue = isOverdueReminder(reminder);
  const dateClassName =
    variant === "mobile"
      ? overdue
        ? "mt-1 text-xs font-semibold text-rose-700"
        : "mt-1 text-xs text-slate-500"
      : overdue
        ? "font-semibold text-rose-700"
        : "font-semibold text-slate-950";

  return (
    <div className={variant === "table" ? undefined : dateClassName}>
      {variant === "table" ? (
        <div className={dateClassName}>{formatDate(reminder.reminder_date)}</div>
      ) : (
        <>
          {formatDate(reminder.reminder_date)}
          {reminder.reminder_time
            ? ` · ${formatReminderTime(reminder.reminder_time)}`
            : ""}
        </>
      )}
      {variant === "table" && reminder.reminder_time ? (
        <div className="mt-1 text-xs text-slate-500">
          {formatReminderTime(reminder.reminder_time)}
        </div>
      ) : null}
    </div>
  );
}

function ReminderForm({ reminder, onClose }: ReminderFormProps) {
  const router = useRouter();
  const action = reminder ? updateReminderAction : createReminderAction;
  const [state, formAction] = useActionState<
    ReminderActionResult | undefined,
    FormData
  >(action, undefined);
  const values = state && !state.ok ? state.values : undefined;
  const formRestoreKey = getFormRestoreKey(values);

  useEffect(() => {
    if (state?.ok) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form key={formRestoreKey} action={formAction} className="grid gap-4 sm:grid-cols-2">
      {reminder ? <input type="hidden" name="id" value={reminder.id} /> : null}

      <FormField label="Hatırlatma tarihi">
        <input
          type="date"
          name="reminder_date"
          className={formInputClassName}
          defaultValue={values?.reminder_date ?? reminder?.reminder_date ?? today}
          required
        />
      </FormField>

      <FormField label="Saat">
        <input
          type="time"
          name="reminder_time"
          className={formInputClassName}
          defaultValue={
            values?.reminder_time ?? formatReminderTime(reminder?.reminder_time)
          }
        />
      </FormField>

      <div className="sm:col-span-2">
        <FormField label="Başlık">
          <input
            type="text"
            name="title"
            className={formInputClassName}
            defaultValue={values?.title ?? reminder?.title ?? ""}
            placeholder="Örn. Kalan borç takibi"
            required
          />
        </FormField>
      </div>

      <FormField label="İlgili hasta">
        <input
          type="text"
          name="patient_name"
          className={formInputClassName}
          defaultValue={values?.patient_name ?? reminder?.patient_name ?? ""}
          placeholder="Örn. Ayşe Kaya"
        />
      </FormField>

      <FormField label="İlgili işlem">
        <input
          type="text"
          name="related_record"
          className={formInputClassName}
          defaultValue={values?.related_record ?? reminder?.related_record ?? ""}
          placeholder="Örn. İşlem #002 veya Kargo #YK245781"
        />
      </FormField>

      <FormField label="Durum">
        <select
          name="status"
          className={formInputClassName}
          defaultValue={values?.status ?? reminder?.status ?? "pending"}
          required
        >
          {reminderStatusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Sorumlu personel">
        <input
          type="text"
          name="responsible_person"
          className={formInputClassName}
          defaultValue={values?.responsible_person ?? reminder?.responsible_person ?? ""}
          placeholder="Örn. Admin Kullanıcı"
        />
      </FormField>

      <div className="sm:col-span-2">
        <FormField label="Açıklama">
          <textarea
            name="description"
            className={formTextareaClassName}
            defaultValue={values?.description ?? reminder?.description ?? ""}
            placeholder="Hatırlatma notu girin."
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
        <button
          type="submit"
          className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
        >
          {reminder ? "Kaydet" : "Hatırlatıcıyı Kaydet"}
        </button>
      </div>
    </form>
  );
}

function DeleteReminderButton({
  reminder,
  onDeleted,
}: Readonly<{ reminder: ReminderRecord; onDeleted: (ids: string[]) => void }>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteReminderAction(reminder.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      onDeleted([reminder.id]);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        className={`${rowActionButtonClassName} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700`}
        aria-label="Sil"
        title="Sil"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>

      {isOpen ? (
        <ActionModal
          title="Hatırlatıcıyı Sil"
          description="Bu hatırlatıcı kalıcı olarak silinecek."
          onClose={() => setIsOpen(false)}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              <strong>{reminder.title}</strong> hatırlatıcısını silmek
              istediğinizden emin misiniz?
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

export function RemindersTable({
  reminders,
}: Readonly<{ reminders: ReminderRecord[] }>) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ReminderStatus>("all");
  const [staffFilter, setStaffFilter] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editReminder, setEditReminder] = useState<ReminderRecord | null>(null);
  const {
    selectedIds,
    selectedRecords,
    visibleRecords,
    handleRecordsDeleted,
    toggleRecordSelection,
    createSelectionState,
  } = useTableBulkSelection(reminders);

  const filteredReminders = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
    const normalizedStaff = staffFilter.trim().toLocaleLowerCase("tr-TR");

    return visibleRecords.filter((reminder) => {
      const searchableText = [
        reminder.title,
        reminder.patient_name,
        reminder.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesStatus = status === "all" || reminder.status === status;
      const matchesStaff =
        !normalizedStaff ||
        (reminder.responsible_person ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedStaff);
      const matchesDate =
        !filterDate || reminder.reminder_date === filterDate;

      return matchesSearch && matchesStatus && matchesStaff && matchesDate;
    });
  }, [filterDate, search, staffFilter, status, visibleRecords]);

  const {
    allFilteredSelected,
    someFilteredSelected,
    toggleFilteredSelection,
  } = createSelectionState(filteredReminders);

  return (
    <>
      <PanelCard
        title="Hatırlatıcı Listesi"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <BulkDeleteRecordsButton
              selectedCount={selectedRecords.length}
              title="Seçili Hatırlatıcıları Sil"
              description="Bu işlem seçili hatırlatıcıları kalıcı olarak silecek."
              confirmMessage={
                <p className="text-sm leading-6 text-slate-700">
                  <strong>{selectedRecords.length}</strong> hatırlatıcıyı silmek
                  istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              }
              preview={
                <div className="max-h-48 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                  <ul className="space-y-1">
                    {selectedRecords.slice(0, 10).map((reminder) => (
                      <li key={reminder.id} className="truncate">
                        {formatDate(reminder.reminder_date)} - {reminder.title}
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
              errorPrefix="Hatırlatıcılar silinemedi"
              successLabel="hatırlatıcı silindi."
              selectedIds={selectedRecords.map((record) => record.id)}
              onDeleted={handleRecordsDeleted}
              onDelete={() =>
                deleteReminderRecords(selectedRecords.map((record) => record.id))
              }
            />
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Yeni Hatırlatıcı
            </button>
          </div>
        }
      >
        <div className={`${panelFilterGridClassName} lg:grid-cols-4`}>
          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Ara</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="size-4" aria-hidden="true" />
              </span>
              <input
                type="search"
                placeholder="Başlık, hasta adı veya açıklama"
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
                setStatus(event.target.value as "all" | ReminderStatus)
              }
            >
              <option value="all">Tümü</option>
              {reminderStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Personel</span>
            <input
              type="search"
              placeholder="Sorumlu personel"
              className={panelFilterInputClassName}
              value={staffFilter}
              onChange={(event) => setStaffFilter(event.target.value)}
            />
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

        {filteredReminders.length > 0 ? (
          <>
            <div className={panelMobileCardListClassName}>
              {filteredReminders.map((reminder) => (
                <article
                  key={`mobile-${reminder.id}`}
                  className={panelMobileCardClassName}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold text-slate-950">
                        {reminder.title}
                      </p>
                      <ReminderDateText reminder={reminder} variant="mobile" />
                    </div>
                    <StatusBadge status={reminder.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <dt className={panelMobileCardLabelClassName}>Hasta</dt>
                      <dd className={panelMobileCardValueClassName}>
                        {reminder.patient_name || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className={panelMobileCardLabelClassName}>Personel</dt>
                      <dd className={panelMobileCardValueClassName}>
                        {reminder.responsible_person || "-"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className={`${panelSecondaryButtonClassName} min-h-11 flex-1`}
                      onClick={() => setEditReminder(reminder)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      Düzenle
                    </button>
                    <DeleteReminderButton
                      reminder={reminder}
                      onDeleted={handleRecordsDeleted}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className={`${panelTableScrollClassName} ${panelTableDesktopClassName}`}>
            <table className="w-full min-w-[1080px] table-fixed border-separate border-spacing-0 text-left text-sm">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[8%]" />
                <col className="w-[21%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    <TableSelectAllCheckbox
                      allSelected={allFilteredSelected}
                      someSelected={someFilteredSelected}
                      onToggle={toggleFilteredSelection}
                    />
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    Hatırlatma Tarihi
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Başlık</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    İlgili Hasta
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    İlgili İşlem
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    Sorumlu Personel
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Durum</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    Açıklama
                  </th>
                  <th className={panelTableActionsHeadClassName}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredReminders.map((reminder) => (
                  <tr
                    key={reminder.id}
                    className="group text-slate-700 transition hover:bg-slate-50"
                  >
                    <td className="border-b border-slate-100 px-3 py-3">
                      <TableRowCheckbox
                        checked={selectedIds.has(reminder.id)}
                        label={`${reminder.title} kaydını seç`}
                        onToggle={() => toggleRecordSelection(reminder.id)}
                      />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 whitespace-nowrap">
                      <ReminderDateText reminder={reminder} />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-950 truncate">
                      {reminder.title}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 truncate">
                      {reminder.patient_name || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 truncate">
                      {reminder.related_record || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 truncate">
                      {reminder.responsible_person || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <StatusBadge status={reminder.status} />
                    </td>
                    <td className="max-w-0 truncate border-b border-slate-100 px-3 py-3">
                      {reminder.description || "-"}
                    </td>
                    <td className={panelTableActionsCellClassName}>
                      <div className="flex shrink-0 items-center justify-end gap-1.5">
                        <button
                          type="button"
                          className={rowActionButtonClassName}
                          aria-label="Düzenle"
                          title="Düzenle"
                          onClick={() => setEditReminder(reminder)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <DeleteReminderButton
                          reminder={reminder}
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
            title="Hatırlatıcı bulunamadı"
            description="Seçili filtrelerle eşleşen hatırlatıcı kaydı yok."
          />
        )}
      </PanelCard>

      {isCreateOpen ? (
        <ActionModal
          title="Yeni Hatırlatıcı"
          description="Takip veya görev hatırlatması oluşturun."
          onClose={() => setIsCreateOpen(false)}
          showPrimary={false}
          showFooter={false}
        >
          <ReminderForm onClose={() => setIsCreateOpen(false)} />
        </ActionModal>
      ) : null}

      {editReminder ? (
        <ActionModal
          title="Hatırlatıcıyı Düzenle"
          description="Hatırlatıcı bilgilerini güncelleyin."
          onClose={() => setEditReminder(null)}
          showPrimary={false}
          showFooter={false}
        >
          <ReminderForm
            reminder={editReminder}
            onClose={() => setEditReminder(null)}
          />
        </ActionModal>
      ) : null}
    </>
  );
}
