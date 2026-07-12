"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BellPlus,
  CalendarDays,
  CreditCard,
  Edit3,
  FileSpreadsheet,
  Package,
  Plus,
  UserRound,
} from "lucide-react";
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
import {
  panelMobileCardClassName,
  panelMobileCardListClassName,
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
  panelTableActionsCellClassName,
  panelTableActionsHeadClassName,
  panelTableDesktopClassName,
  panelTableScrollClassName,
} from "@/components/panel/panel-styles";
import { StatusBadge } from "@/components/panel/status-badge";
import { TransactionPaymentActions } from "@/components/panel/transaction-payment-actions";
import { TransactionPaymentForm } from "@/components/panel/transaction-payment-form";
import { getFormRestoreKey } from "@/lib/panel-form";
import {
  formatReminderTime,
  reminderStatusOptions,
  type ReminderRecord,
} from "@/lib/reminders";
import {
  earSideLabels,
  formatCurrency,
  formatDate,
  paymentMethodLabels,
  type PatientTransactionRecord,
  type TransactionPaymentRecord,
} from "@/lib/transactions";

type TransactionDetailWorkspaceProps = {
  transaction: PatientTransactionRecord;
  payments: TransactionPaymentRecord[];
  reminder: ReminderRecord | null;
};

type TabId = "general" | "payments" | "device" | "reminders";

type InfoItem = {
  label: string;
  value: ReactNode;
  wide?: boolean;
};

function hasDisplayValue(value: ReactNode) {
  return value !== null && value !== undefined && value !== "";
}

function LegacyExcelBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800">
      <FileSpreadsheet className="size-3.5" aria-hidden="true" />
      Eski Excel Kaydı
    </span>
  );
}

function EmptyState({
  title,
  description,
}: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function InfoGrid({ items }: Readonly<{ items: InfoItem[] }>) {
  const visibleItems = items.filter((item) => hasDisplayValue(item.value));

  if (visibleItems.length === 0) {
    return (
      <EmptyState
        title="Ek bilgi yok"
        description="Bu bölüm için gösterilecek ek alan bulunmuyor."
      />
    );
  }

  return (
    <dl className="grid gap-x-8 gap-y-5 md:grid-cols-2">
      {visibleItems.map((item) => (
        <div
          key={item.label}
          className={item.wide ? "md:col-span-2" : undefined}
        >
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {item.label}
          </dt>
          <dd className="mt-1.5 text-sm font-semibold leading-6 break-words text-slate-950">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SummaryValue({
  label,
  value,
  tone = "default",
}: Readonly<{
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "danger";
}>) {
  const toneClassName =
    tone === "success"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-rose-700"
        : "text-slate-950";

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <div className={`mt-1 text-lg font-black ${toneClassName}`}>{value}</div>
    </div>
  );
}

function TabButton({
  id,
  label,
  icon,
  activeTab,
  onSelect,
}: Readonly<{
  id: TabId;
  label: string;
  icon: ReactNode;
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}>) {
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
        isActive
          ? "bg-slate-950 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function TransactionDetailWorkspace({
  transaction,
  payments,
  reminder,
}: Readonly<TransactionDetailWorkspaceProps>) {
  const router = useRouter();
  const isLegacyExcelRecord = transaction.source_type === "legacy_excel";
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState<Record<string, string> | null>(
    null,
  );
  const [isReminderPending, startReminderTransition] = useTransition();
  const lastPayment = payments[0];
  const hasDeviceInfo = Boolean(
    transaction.brand ||
      transaction.model ||
      transaction.serial_no ||
      transaction.ear_side ||
      transaction.stock_deduct_enabled,
  );

  const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
    {
      id: "general",
      label: "Genel Bilgiler",
      icon: <UserRound className="size-4" aria-hidden="true" />,
    },
    ...(!isLegacyExcelRecord
      ? [
          {
            id: "payments" as const,
            label: "Ödemeler",
            icon: <CreditCard className="size-4" aria-hidden="true" />,
          },
          {
            id: "device" as const,
            label: "Cihaz / Stok",
            icon: <Package className="size-4" aria-hidden="true" />,
          },
        ]
      : []),
    {
      id: "reminders",
      label: "Hatırlatıcılar",
      icon: <CalendarDays className="size-4" aria-hidden="true" />,
    },
  ];

  const stockConnectionValue = transaction.stock_deduct_enabled
    ? `${transaction.stock_product_label ?? "Ürün"}${
        transaction.stock_quantity ? ` · ${transaction.stock_quantity} adet` : ""
      }`
    : "";

  const generalItems: InfoItem[] = [
    { label: "Hasta adı soyadı", value: transaction.patient_name },
    { label: "Telefon", value: transaction.patient_phone },
    { label: "İşlem no", value: transaction.transaction_no },
    { label: "Şube / birim", value: transaction.branch },
    { label: "Tarih", value: formatDate(transaction.transaction_date) },
    { label: "Hastane", value: transaction.hospital },
    { label: "Hekim", value: transaction.doctor_name },
    { label: "Referans", value: transaction.reference_source },
    { label: "İlgilenen personel", value: transaction.staff_name },
    {
      label: "Yapılan işlem",
      value: transaction.operation_description,
      wide: true,
    },
    { label: "Açıklama", value: transaction.description, wide: true },
    { label: "Not", value: transaction.notes, wide: true },
  ];

  const deviceItems: InfoItem[] = [
    { label: "Marka", value: transaction.brand },
    { label: "Model", value: transaction.model },
    { label: "Seri no", value: transaction.serial_no },
    {
      label: "Kulak",
      value: transaction.ear_side
        ? earSideLabels[transaction.ear_side] ?? transaction.ear_side
        : "",
    },
    { label: "Stok bağlantısı", value: stockConnectionValue, wide: true },
  ];

  const closeReminder = () => {
    if (isReminderPending) return;
    setReminderError(null);
    setReminderDraft(null);
    setIsReminderOpen(false);
  };

  const handleReminderSubmit = (formData: FormData) => {
    setReminderError(null);
    const submittedValues = {
      reminder_date: String(formData.get("reminder_date") ?? ""),
      status: String(formData.get("status") ?? reminder?.status ?? "pending"),
      description: String(formData.get("description") ?? ""),
    };

    startReminderTransition(async () => {
      const result = reminder
        ? await updateTransactionReminderAction(reminder.id, transaction.id, formData)
        : await createTransactionReminderAction(transaction.id, formData);

      if (!result.ok) {
        setReminderDraft(submittedValues);
        setReminderError(result.error);
        return;
      }

      setReminderDraft(null);
      setIsReminderOpen(false);
      router.refresh();
    });
  };

  const reminderFormValues = reminderDraft ?? {
    reminder_date: reminder?.reminder_date ?? "",
    status: reminder?.status ?? "pending",
    description: reminder?.description ?? "",
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {isLegacyExcelRecord ? <LegacyExcelBadge /> : null}
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                  {transaction.transaction_no ?? "İşlem kaydı"}
                </span>
                <StatusBadge status={transaction.payment_status} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {transaction.patient_name}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {formatDate(transaction.transaction_date)}
                {transaction.operation_description
                  ? ` · ${transaction.operation_description}`
                  : ""}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link
                href="/panel/transactions"
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Listeye Dön
              </Link>
              <button
                type="button"
                className={`${panelSecondaryButtonClassName} w-full opacity-60 sm:w-auto`}
                disabled
                title="Bu işlem için düzenleme ekranı henüz tanımlı değil."
              >
                <Edit3 className="size-4" aria-hidden="true" />
                Düzenle
              </button>
              {!isLegacyExcelRecord ? (
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Ödeme Ekle
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("reminders");
                  setIsReminderOpen(true);
                }}
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
              >
                <BellPlus className="size-4" aria-hidden="true" />
                {reminder ? "Hatırlatıcıyı Düzenle" : "Hatırlatıcı Ekle"}
              </button>
            </div>
          </div>
        </div>

        {!isLegacyExcelRecord ? (
          <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
            <SummaryValue
              label="Satış tutarı"
              value={formatCurrency(transaction.sale_amount)}
            />
            <SummaryValue
              label="Ödenen tutar"
              value={formatCurrency(transaction.paid_amount)}
              tone="success"
            />
            <SummaryValue
              label="Kalan borç"
              value={formatCurrency(transaction.remaining_debt)}
              tone={transaction.remaining_debt > 0 ? "danger" : "success"}
            />
            <SummaryValue
              label="İşlem durumu"
              value={<StatusBadge status={transaction.payment_status} />}
            />
          </div>
        ) : (
          <div className="px-5 py-5 sm:px-6 lg:px-8">
            <p className="max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Bu kayıt eski Excel faaliyet aktarımıyla oluşturuldu. Ödeme, makbuz
              ve stok aksiyonları finansal akışı etkilememesi için gizlendi.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 pb-4">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
          ))}
        </div>

        <div className="pt-6">
          {activeTab === "general" ? (
            <div className="space-y-6">
              <InfoGrid items={generalItems} />
              {isLegacyExcelRecord ? (
                <div className="rounded-2xl bg-violet-50/70 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
                    Legacy kaynak
                  </p>
                  <p className="mt-1 text-sm font-semibold text-violet-950">
                    {transaction.legacy_sheet_name
                      ? `${transaction.legacy_sheet_name} sheet`
                      : "Excel kaydı"}
                    {transaction.legacy_row_number
                      ? ` · ${transaction.legacy_row_number}. satır`
                      : ""}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "payments" && !isLegacyExcelRecord ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <SummaryValue
                    label="Son ödeme tarihi"
                    value={lastPayment ? formatDate(lastPayment.payment_date) : "Yok"}
                  />
                  <SummaryValue
                    label="Son ödeme yöntemi"
                    value={
                      lastPayment
                        ? paymentMethodLabels[lastPayment.payment_method]
                        : "Yok"
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Yeni Ödeme Ekle
                </button>
              </div>

              {payments.length > 0 ? (
                <>
                  <div className={panelMobileCardListClassName}>
                    {payments.map((payment) => (
                      <article
                        key={`mobile-payment-${payment.id}`}
                        className={panelMobileCardClassName}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-950">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(payment.payment_date)}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            {paymentMethodLabels[payment.payment_method]}
                          </span>
                        </div>
                        {payment.description ? (
                          <p className="mt-2 text-sm text-slate-600">
                            {payment.description}
                          </p>
                        ) : null}
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <TransactionPaymentActions payment={payment} />
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className={`${panelTableScrollClassName} ${panelTableDesktopClassName}`}>
                  <table className="min-w-[860px] w-full border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-2">
                          Ödeme Tarihi
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Ödeme Yöntemi
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-right">
                          Tutar
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Açıklama
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Alan Personel
                        </th>
                        <th className={panelTableActionsHeadClassName}>
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="group text-slate-700 transition hover:bg-slate-50"
                        >
                          <td className="border-b border-slate-100 px-3 py-2.5">
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2.5">
                            {paymentMethodLabels[payment.payment_method]}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2.5 text-right font-semibold tabular-nums text-slate-950">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="max-w-[220px] truncate border-b border-slate-100 px-3 py-2.5">
                            {payment.description || "Ek bilgi yok"}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2.5">
                            {payment.received_by || "Ek bilgi yok"}
                          </td>
                          <td className={panelTableActionsCellClassName}>
                            <TransactionPaymentActions payment={payment} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              ) : (
                <EmptyState
                  title="Ödeme kaydı yok"
                  description="Bu işlem için henüz ödeme eklenmemiş."
                />
              )}
            </div>
          ) : null}

          {activeTab === "device" && !isLegacyExcelRecord ? (
            hasDeviceInfo ? (
              <InfoGrid items={deviceItems} />
            ) : (
              <EmptyState
                title="Cihaz veya stok bilgisi yok"
                description="Bu işlem için cihaz, seri no veya stok bağlantısı girilmemiş."
              />
            )
          ) : null}

          {activeTab === "reminders" ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Hatırlatıcılar
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Bu işlemle ilişkilendirilen hatırlatma kaydı.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReminderOpen(true)}
                  className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
                >
                  <BellPlus className="size-4" aria-hidden="true" />
                  {reminder ? "Hatırlatıcıyı Düzenle" : "Hatırlatıcı Ekle"}
                </button>
              </div>

              {reminder ? (
                <div className="rounded-3xl bg-slate-50 px-4 py-4">
                  <InfoGrid
                    items={[
                      {
                        label: "Tarih",
                        value: formatDate(reminder.reminder_date),
                      },
                      {
                        label: "Saat",
                        value: formatReminderTime(reminder.reminder_time),
                      },
                      {
                        label: "Durum",
                        value: <StatusBadge status={reminder.status} />,
                      },
                      {
                        label: "Sorumlu",
                        value: reminder.responsible_person,
                      },
                      {
                        label: "Açıklama",
                        value: reminder.description,
                        wide: true,
                      },
                    ]}
                  />
                </div>
              ) : (
                <EmptyState
                  title="Hatırlatıcı yok"
                  description="Bu işlem için henüz hatırlatıcı oluşturulmamış."
                />
              )}
            </div>
          ) : null}
        </div>
      </section>

      {isPaymentOpen && !isLegacyExcelRecord ? (
        <ActionModal
          title="Yeni Ödeme Ekle"
          description="Ödeme kaydı başarıyla eklendiğinde liste otomatik güncellenir."
          onClose={() => setIsPaymentOpen(false)}
          showPrimary={false}
          showFooter={false}
        >
          <TransactionPaymentForm
            transactionId={transaction.id}
            defaultReceivedBy={transaction.staff_name ?? ""}
            onSuccess={() => setIsPaymentOpen(false)}
          />
        </ActionModal>
      ) : null}

      {isReminderOpen ? (
        <ActionModal
          title={reminder ? "Hatırlatıcıyı Düzenle" : "Hatırlatıcı Ekle"}
          onClose={closeReminder}
          showPrimary={false}
          showFooter={false}
        >
          <form
            key={getFormRestoreKey(reminderDraft)}
            action={handleReminderSubmit}
            className="grid gap-4"
          >
            <FormField label="Hatırlatma tarihi">
              <input
                type="date"
                name="reminder_date"
                className={formInputClassName}
                defaultValue={reminderFormValues.reminder_date}
                required
              />
            </FormField>

            {reminder ? (
              <FormField label="Durum">
                <select
                  name="status"
                  className={formInputClassName}
                  defaultValue={reminderFormValues.status}
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
                defaultValue={reminderFormValues.description}
              />
            </FormField>

            {reminderError ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {reminderError}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeReminder}
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
                disabled={isReminderPending}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className={`${panelPrimaryButtonClassName} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70`}
                disabled={isReminderPending}
              >
                {isReminderPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </ActionModal>
      ) : null}
    </div>
  );
}
