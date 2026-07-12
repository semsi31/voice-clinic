"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Trash2 } from "lucide-react";
import {
  deleteTransactionPaymentAction,
  getPaymentReceiptUrlAction,
  regeneratePaymentReceiptAction,
  updateTransactionPaymentAction,
  type PaymentFormValues,
} from "@/app/(panel)/panel/transactions/actions";
import {
  ActionModal,
  FormField,
  formInputClassName,
  formTextareaClassName,
} from "@/components/panel/action-modal";
import {
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
} from "@/components/panel/panel-styles";
import { rowActionButtonClassName } from "@/components/panel/row-actions";
import { getFormRestoreKey } from "@/lib/panel-form";
import type { TransactionPaymentRecord } from "@/lib/transactions";

type TransactionPaymentActionsProps = {
  payment: TransactionPaymentRecord;
};

export function TransactionPaymentActions({
  payment,
}: Readonly<TransactionPaymentActionsProps>) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<PaymentFormValues | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isReceiptPending, startReceiptTransition] = useTransition();
  const [isCreateReceiptPending, startCreateReceiptTransition] = useTransition();

  const closeEdit = () => {
    if (isPending) return;
    setError(null);
    setWarning(null);
    setDraftValues(null);
    setIsEditOpen(false);
  };

  const closeDelete = () => {
    if (isPending) return;
    setError(null);
    setIsDeleteOpen(false);
  };

  const handleUpdate = (formData: FormData) => {
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const result = await updateTransactionPaymentAction(payment.id, formData);

      if (!result.ok) {
        setError(result.error);
        if (result.values) {
          setDraftValues(result.values);
        }
        return;
      }

      setDraftValues(null);
      setIsEditOpen(false);
      router.refresh();

      if (result.warning) {
        setWarning(result.warning);
      }
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteTransactionPaymentAction(payment.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsDeleteOpen(false);
      router.refresh();
    });
  };

  const handleOpenReceipt = () => {
    setReceiptError(null);
    startReceiptTransition(async () => {
      const result = await getPaymentReceiptUrlAction(payment.id);

      if (!result.ok) {
        setReceiptError(result.error);
        return;
      }

      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  const handleCreateReceipt = () => {
    setReceiptError(null);
    startCreateReceiptTransition(async () => {
      const result = await regeneratePaymentReceiptAction(payment.id);

      if (!result.ok) {
        setReceiptError(result.error);
        return;
      }

      router.refresh();
    });
  };

  const editValues: PaymentFormValues = draftValues ?? {
    payment_date: payment.payment_date,
    payment_method: payment.payment_method,
    amount: String(payment.amount),
    description: payment.description ?? "",
    received_by: payment.received_by ?? "",
  };

  return (
    <>
      <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {payment.receipt_document_id ? (
            <button
              type="button"
              className={rowActionButtonClassName}
              aria-label="Makbuzu Aç"
              title="Makbuz"
              onClick={handleOpenReceipt}
              disabled={isReceiptPending}
            >
              <FileText className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                Makbuz yok
              </span>
              <button
                type="button"
                className={`${rowActionButtonClassName} px-2 text-[11px] font-bold`}
                aria-label="Makbuzu Oluştur"
                title="Makbuzu Oluştur"
                onClick={handleCreateReceipt}
                disabled={isCreateReceiptPending}
              >
                {isCreateReceiptPending ? "..." : "Oluştur"}
              </button>
            </>
          )}
          <button
            type="button"
            className={rowActionButtonClassName}
            aria-label="Ödemeyi Düzenle"
            title="Ödemeyi Düzenle"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${rowActionButtonClassName} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700`}
            aria-label="Ödemeyi Sil"
            title="Ödemeyi Sil"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
        {receiptError ? (
          <span
            role="alert"
            className="max-w-48 text-right text-[11px] font-semibold text-rose-700"
          >
            {receiptError}
          </span>
        ) : null}
        {warning ? (
          <span
            role="status"
            className="max-w-48 text-right text-[11px] font-semibold text-amber-800"
          >
            {warning}
          </span>
        ) : null}
      </div>

      {isEditOpen ? (
        <ActionModal
          title="Ödemeyi Düzenle"
          onClose={closeEdit}
          showPrimary={false}
          showFooter={false}
        >
          <form
            key={getFormRestoreKey(draftValues)}
            action={handleUpdate}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Ödeme tarihi">
                <input
                  type="date"
                  name="payment_date"
                  className={formInputClassName}
                  defaultValue={editValues.payment_date}
                  required
                />
              </FormField>
              <FormField label="Ödeme yöntemi">
                <select
                  name="payment_method"
                  className={formInputClassName}
                  defaultValue={editValues.payment_method}
                  required
                >
                  <option value="cash">Nakit</option>
                  <option value="credit_card">Kredi Kartı</option>
                  <option value="bank_transfer">Havale</option>
                </select>
              </FormField>
              <FormField label="Tutar">
                <input
                  type="text"
                  name="amount"
                  inputMode="decimal"
                  className={formInputClassName}
                  defaultValue={editValues.amount}
                  required
                />
              </FormField>
              <FormField label="Alan personel">
                <input
                  type="text"
                  name="received_by"
                  className={formInputClassName}
                  defaultValue={editValues.received_by}
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Açıklama">
                  <textarea
                    name="description"
                    className={formTextareaClassName}
                    defaultValue={editValues.description}
                  />
                </FormField>
              </div>
            </div>

            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEdit}
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

      {isDeleteOpen ? (
        <ActionModal
          title="Ödemeyi Sil"
          description="Bu ödeme kaydı silinecek. Kalan borç yeniden hesaplanır."
          onClose={closeDelete}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              Bu ödeme kaydını silmek istediğinizden emin misiniz?
            </p>
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDelete}
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
