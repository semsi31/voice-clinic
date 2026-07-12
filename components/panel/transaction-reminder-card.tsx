"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import {
  createTransactionReminderAction,
  updateTransactionReminderAction,
} from "@/app/(panel)/panel/transactions/actions";
import {
  ActionModal,
  FormField,
  formInputClassName,
  formTextareaClassName,
} from "@/components/panel/action-modal";
import { PanelCard } from "@/components/panel/panel-card";
import {
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
} from "@/components/panel/panel-styles";
import { StatusBadge } from "@/components/panel/status-badge";
import { getFormRestoreKey } from "@/lib/panel-form";
import {
  formatReminderTime,
  reminderStatusOptions,
  type ReminderRecord,
} from "@/lib/reminders";
import { formatDate } from "@/lib/transactions";

type TransactionReminderCardProps = {
  transaction: {
    id: string;
    transaction_no: string | null;
    patient_name: string;
    staff_name: string | null;
  };
  reminder: ReminderRecord | null;
};

function ReminderDetailField({
  label,
  value,
  fullWidth = false,
}: Readonly<{
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}>) {
  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 ${
        fullWidth ? "col-span-2" : ""
      }`}
    >
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold leading-5 break-words text-slate-900">
        {value}
      </dd>
    </div>
  );
}

export function TransactionReminderCard({
  transaction,
  reminder,
}: Readonly<TransactionReminderCardProps>) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string> | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(reminder);

  const closeForm = () => {
    if (isPending) return;
    setError(null);
    setDraftValues(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const submittedValues = {
      reminder_date: String(formData.get("reminder_date") ?? ""),
      status: String(formData.get("status") ?? reminder?.status ?? "pending"),
      description: String(formData.get("description") ?? ""),
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateTransactionReminderAction(
            reminder!.id,
            transaction.id,
            formData,
          )
        : await createTransactionReminderAction(transaction.id, formData);

      if (!result.ok) {
        setDraftValues(submittedValues);
        setError(result.error);
        return;
      }

      setDraftValues(null);
      setIsFormOpen(false);
      router.refresh();
    });
  };

  const formValues = draftValues ?? {
    reminder_date: reminder?.reminder_date ?? "",
    status: reminder?.status ?? "pending",
    description: reminder?.description ?? "",
  };
  const formRestoreKey = getFormRestoreKey(draftValues);

  return (
    <>
      <PanelCard title="İlgili Hatırlatıcı">
        {reminder ? (
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ReminderDetailField
                label="Tarih"
                value={formatDate(reminder.reminder_date)}
              />
              {reminder.reminder_time ? (
                <ReminderDetailField
                  label="Saat"
                  value={formatReminderTime(reminder.reminder_time)}
                />
              ) : null}
              <ReminderDetailField
                label="Durum"
                value={<StatusBadge status={reminder.status} />}
                fullWidth={Boolean(reminder.reminder_time)}
              />
              <ReminderDetailField
                label="Açıklama"
                value={reminder.description ?? "-"}
                fullWidth
              />
            </dl>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className={`${panelSecondaryButtonClassName} w-full`}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Hatırlatıcıyı Düzenle
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-sm font-medium text-slate-600">
                Bu işlem için hatırlatıcı bulunmuyor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className={`${panelPrimaryButtonClassName} w-full`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Hatırlatıcı Ekle
            </button>
          </div>
        )}
      </PanelCard>

      {isFormOpen ? (
        <ActionModal
          title={isEditing ? "Hatırlatıcıyı Düzenle" : "Hatırlatıcı Ekle"}
          onClose={closeForm}
          showPrimary={false}
          showFooter={false}
        >
          <form
            key={formRestoreKey}
            action={handleSubmit}
            className="grid gap-4"
          >
            <FormField label="Hatırlatma tarihi">
              <input
                type="date"
                name="reminder_date"
                className={formInputClassName}
                defaultValue={formValues.reminder_date}
                required
              />
            </FormField>

            {isEditing ? (
              <FormField label="Durum">
                <select
                  name="status"
                  className={formInputClassName}
                  defaultValue={formValues.status}
                  required
                >
                  {reminderStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : null}

            <FormField label="Açıklama">
              <textarea
                name="description"
                className={formTextareaClassName}
                placeholder="Hatırlatıcı notu (opsiyonel)"
                defaultValue={formValues.description}
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
                onClick={closeForm}
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
                disabled={isPending}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className={`${panelPrimaryButtonClassName} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70`}
                disabled={isPending}
              >
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </ActionModal>
      ) : null}
    </>
  );
}
