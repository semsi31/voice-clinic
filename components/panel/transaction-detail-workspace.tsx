"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { PanelDetailGrid } from "@/components/panel/panel-detail-fields";
import { PanelLink } from "@/components/panel/panel-link";
import {
  ArrowLeft,
  BellPlus,
  CalendarDays,
  CreditCard,
  FileSpreadsheet,
  Package,
  PackageCheck,
  PackageX,
  Plus,
  UserRound,
} from "lucide-react";
import {
  createTransactionReminderAction,
  getTransactionPaymentsAction,
  getTransactionReminderAction,
  updateDeviceDeliveryStatus,
  updateTransactionReminderAction,
} from "@/app/(panel)/panel/transactions/actions";
import {
  ActionModal,
  FormField,
  formInputClassName,
  formTextareaClassName,
} from "@/components/panel/action-modal";
import { PanelTableFrame } from "@/components/panel/panel-table-frame";
import {
  panelMobileCardClassName,
  panelMobileCardListClassName,
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
  panelTableActionsCellClassName,
  panelTableActionsColClassName,
  panelTableActionsHeadClassName,
  panelTableCellClassName,
  panelTableClassName,
  panelTableHeadClassName,
  panelTableHeadRowClassName,
  panelTableRowClassName,
} from "@/components/panel/panel-styles";
import { DeviceDeliveryBadge, StatusBadge } from "@/components/panel/status-badge";
import { getFormRestoreKey } from "@/lib/panel-form";
import {
  formatReminderTime,
  reminderStatusOptions,
  type ReminderRecord,
} from "@/lib/reminders";
import { runTimedMutation } from "@/lib/run-timed-mutation";
import {
  earSideLabels,
  formatCurrency,
  formatDate,
  paymentMethodLabels,
  type DeviceDeliveryStatus,
  type PatientTransactionRecord,
  type TransactionPaymentRecord,
} from "@/lib/transactions";

const TransactionPaymentForm = dynamic(
  () =>
    import("@/components/panel/transaction-payment-form").then((mod) => ({
      default: mod.TransactionPaymentForm,
    })),
  { ssr: false },
);

const TransactionPaymentActions = dynamic(
  () =>
    import("@/components/panel/transaction-payment-actions").then((mod) => ({
      default: mod.TransactionPaymentActions,
    })),
  { ssr: false },
);

type TransactionDetailWorkspaceProps = {
  transaction: PatientTransactionRecord;
};

type TabId = "general" | "payments" | "device" | "reminders";

type InfoItem = {
  label: string;
  value: ReactNode;
  wide?: boolean;
};

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
  return (
    <PanelDetailGrid
      items={items}
      emptyTitle="Ek bilgi yok"
      emptyDescription="Bu bölüm için gösterilecek ek alan bulunmuyor."
    />
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
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
      <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">{label}</p>
      <div
        className={`mt-1 text-sm font-bold break-words sm:text-base lg:text-lg ${toneClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

function DeviceDeliveryActions({
  transactionId,
  status,
}: Readonly<{
  transactionId: string;
  status: DeviceDeliveryStatus;
}>) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const markStatus = (nextStatus: DeviceDeliveryStatus) => {
    if (isPending || nextStatus === currentStatus) {
      return;
    }
    setError(null);
    const previous = currentStatus;
    setCurrentStatus(nextStatus);

    startTransition(async () => {
      const result = await runTimedMutation(
        { action: "updateDeviceDeliveryStatus", clientRefresh: false },
        () => updateDeviceDeliveryStatus(transactionId, nextStatus),
      );
      if (!result.ok) {
        setCurrentStatus(previous);
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-2 px-3 pb-3 sm:px-6 sm:pb-5 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={isPending || currentStatus === "delivered"}
          onClick={() => markStatus("delivered")}
          className={`${panelPrimaryButtonClassName} w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
        >
          <PackageCheck className="size-4" aria-hidden="true" />
          {isPending ? "Güncelleniyor..." : "Teslim Edildi Olarak İşaretle"}
        </button>
        <button
          type="button"
          disabled={isPending || currentStatus === "pending"}
          onClick={() => markStatus("pending")}
          className={`${panelSecondaryButtonClassName} w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
        >
          <PackageX className="size-4" aria-hidden="true" />
          {isPending ? "Güncelleniyor..." : "Teslim Edilmedi Olarak İşaretle"}
        </button>
      </div>
      {error ? (
        <p className="text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TabButton({
  id,
  label,
  shortLabel,
  icon,
  activeTab,
  onSelect,
}: Readonly<{
  id: TabId;
  label: string;
  shortLabel: string;
  icon: ReactNode;
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}>) {
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm ${
        isActive
          ? "bg-slate-950 text-white shadow-sm"
          : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      {icon}
      <span className="sm:hidden">{shortLabel}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function TransactionDetailWorkspace({
  transaction,
}: Readonly<TransactionDetailWorkspaceProps>) {
  const isLegacyExcelRecord = transaction.source_type === "legacy_excel";
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState<Record<string, string> | null>(
    null,
  );
  const [isReminderPending, startReminderTransition] = useTransition();
  const [payments, setPayments] = useState<TransactionPaymentRecord[]>([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [reminder, setReminder] = useState<ReminderRecord | null>(null);
  const [reminderLoaded, setReminderLoaded] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderLoadError, setReminderLoadError] = useState<string | null>(null);
  const lastPayment = payments[0];

  const loadPayments = async () => {
    if (paymentsLoading) return;
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const result = await getTransactionPaymentsAction(transaction.id);
      if (!result.ok) {
        setPaymentsError(result.error);
        return;
      }
      setPayments(result.payments);
      setPaymentsLoaded(true);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadReminder = async () => {
    if (reminderLoading) return;
    setReminderLoading(true);
    setReminderLoadError(null);
    try {
      const result = await getTransactionReminderAction(
        transaction.id,
        transaction.transaction_no,
      );
      if (!result.ok) {
        setReminderLoadError(result.error);
        return;
      }
      setReminder(result.reminder);
      setReminderLoaded(true);
    } finally {
      setReminderLoading(false);
    }
  };

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    if (id === "payments" && !isLegacyExcelRecord && !paymentsLoaded) {
      void loadPayments();
    }
    if (id === "reminders" && !reminderLoaded) {
      void loadReminder();
    }
  };

  const tabs: Array<{
    id: TabId;
    label: string;
    shortLabel: string;
    icon: ReactNode;
  }> = [
    {
      id: "general",
      label: "Genel Bilgiler",
      shortLabel: "Genel",
      icon: <UserRound className="size-4" aria-hidden="true" />,
    },
    ...(!isLegacyExcelRecord
      ? [
          {
            id: "payments" as const,
            label: "Ödemeler",
            shortLabel: "Ödeme",
            icon: <CreditCard className="size-4" aria-hidden="true" />,
          },
          {
            id: "device" as const,
            label: "Cihaz / Stok",
            shortLabel: "Cihaz",
            icon: <Package className="size-4" aria-hidden="true" />,
          },
        ]
      : []),
    {
      id: "reminders",
      label: "Hatırlatıcılar",
      shortLabel: "Hatırlatma",
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
    {
      label: "Cihaz Teslim Durumu",
      value: (
        <DeviceDeliveryBadge
          status={transaction.device_delivery_status ?? "pending"}
        />
      ),
    },
    {
      label: "Teslim Tarihi",
      value: transaction.device_delivered_at
        ? formatDate(transaction.device_delivered_at)
        : "",
    },
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
      setReminderLoaded(false);
      await loadReminder();
    });
  };

  const reminderFormValues = reminderDraft ?? {
    reminder_date: reminder?.reminder_date ?? "",
    status: reminder?.status ?? "pending",
    description: reminder?.description ?? "",
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <PanelLink
                href="/panel/transactions"
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Listeye Dön
              </PanelLink>
              {isLegacyExcelRecord ? <LegacyExcelBadge /> : null}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight break-words text-slate-950 sm:text-3xl">
                {transaction.patient_name}
              </h1>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                {formatDate(transaction.transaction_date)}
                {transaction.operation_description
                  ? ` · ${transaction.operation_description}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {!isLegacyExcelRecord ? (
          <>
            <div className="grid grid-cols-2 gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-5 lg:grid-cols-3 xl:grid-cols-5 lg:px-8">
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
              <SummaryValue
                label="Teslim durumu"
                value={
                  <DeviceDeliveryBadge
                    status={transaction.device_delivery_status ?? "pending"}
                  />
                }
              />
            </div>
            <DeviceDeliveryActions
              transactionId={transaction.id}
              status={transaction.device_delivery_status ?? "pending"}
            />
          </>
        ) : (
          <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <p className="max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Bu kayıt eski Excel faaliyet aktarımıyla oluşturuldu. Ödeme, makbuz
              ve stok aksiyonları finansal akışı etkilememesi için gizlendi.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-3 [scrollbar-width:thin] sm:gap-2 sm:pb-4">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              shortLabel={tab.shortLabel}
              icon={tab.icon}
              activeTab={activeTab}
              onSelect={selectTab}
            />
          ))}
        </div>

        <div className="pt-2 sm:pt-4">
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
              {paymentsLoading && !paymentsLoaded ? (
                <div className="h-40 animate-pulse rounded-2xl bg-slate-50" />
              ) : null}
              {paymentsError ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {paymentsError}
                </p>
              ) : null}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <SummaryValue
                    label="Son ödeme tarihi"
                    value={
                      !paymentsLoaded
                        ? "—"
                        : lastPayment
                          ? formatDate(lastPayment.payment_date)
                          : "Yok"
                    }
                  />
                  <SummaryValue
                    label="Son ödeme yöntemi"
                    value={
                      !paymentsLoaded
                        ? "—"
                        : lastPayment
                          ? paymentMethodLabels[lastPayment.payment_method]
                          : "Yok"
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  className={`${panelPrimaryButtonClassName} w-full sm:w-auto sm:self-end`}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Yeni Ödeme Ekle
                </button>
              </div>

              {paymentsLoaded && payments.length > 0 ? (
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
                          <TransactionPaymentActions
                            payment={payment}
                            onMutated={() => {
                              setPaymentsLoaded(false);
                              void loadPayments();
                            }}
                          />
                        </div>
                      </article>
                    ))}
                  </div>

                  <PanelTableFrame>
                    <table className={panelTableClassName}>
                      <colgroup>
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col className={panelTableActionsColClassName} />
                      </colgroup>
                      <thead>
                        <tr className={panelTableHeadRowClassName}>
                          <th className={panelTableHeadClassName}>Ödeme Tarihi</th>
                          <th className={panelTableHeadClassName}>Ödeme Yöntemi</th>
                          <th className={panelTableHeadClassName}>Tutar</th>
                          <th className={panelTableHeadClassName}>Açıklama</th>
                          <th className={panelTableHeadClassName}>Alan Personel</th>
                          <th className={panelTableActionsHeadClassName}>
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr
                            key={payment.id}
                            className={panelTableRowClassName}
                          >
                            <td
                              className={panelTableCellClassName}
                              title={formatDate(payment.payment_date)}
                            >
                              {formatDate(payment.payment_date)}
                            </td>
                            <td className={panelTableCellClassName}>
                              {paymentMethodLabels[payment.payment_method]}
                            </td>
                            <td
                              className={`${panelTableCellClassName} font-semibold tabular-nums text-slate-950`}
                              title={formatCurrency(payment.amount)}
                            >
                              {formatCurrency(payment.amount)}
                            </td>
                            <td
                              className={panelTableCellClassName}
                              title={payment.description || undefined}
                            >
                              {payment.description || "-"}
                            </td>
                            <td
                              className={panelTableCellClassName}
                              title={payment.received_by || undefined}
                            >
                              {payment.received_by || "-"}
                            </td>
                            <td className={panelTableActionsCellClassName}>
                              <TransactionPaymentActions
                                payment={payment}
                                variant="table"
                                onMutated={() => {
                                  setPaymentsLoaded(false);
                                  void loadPayments();
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </PanelTableFrame>
                </>
              ) : paymentsLoaded ? (
                <EmptyState
                  title="Ödeme kaydı yok"
                  description="Bu işlem için henüz ödeme eklenmemiş."
                />
              ) : null}
            </div>
          ) : null}

          {activeTab === "device" && !isLegacyExcelRecord ? (
            <InfoGrid items={deviceItems} />
          ) : null}

          {activeTab === "reminders" ? (
            <div className="space-y-5">
              {reminderLoading && !reminderLoaded ? (
                <div className="h-40 animate-pulse rounded-2xl bg-slate-50" />
              ) : null}
              {reminderLoadError ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {reminderLoadError}
                </p>
              ) : null}
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
                  disabled={!reminderLoaded}
                >
                  <BellPlus className="size-4" aria-hidden="true" />
                  {reminder ? "Hatırlatıcıyı Düzenle" : "Hatırlatıcı Ekle"}
                </button>
              </div>

              {reminderLoaded && reminder ? (
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
              ) : reminderLoaded ? (
                <EmptyState
                  title="Hatırlatıcı yok"
                  description="Bu işlem için henüz hatırlatıcı oluşturulmamış."
                />
              ) : null}
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
            onSuccess={() => {
              setIsPaymentOpen(false);
              setPaymentsLoaded(false);
              void loadPayments();
            }}
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
