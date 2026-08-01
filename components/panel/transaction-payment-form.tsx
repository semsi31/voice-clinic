"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import {
  addTransactionPayment,
  type PaymentFormValues,
  type TransactionActionState,
} from "@/app/(panel)/panel/transactions/actions";
import { getFormRestoreKey } from "@/lib/panel-form";
import { panelPrimaryButtonClassName } from "@/components/panel/panel-styles";
import { runTimedMutation } from "@/lib/run-timed-mutation";

const inputClassName =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

function Field({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SubmitButton({ isPending }: Readonly<{ isPending: boolean }>) {
  const { pending } = useFormStatus();
  const isSubmitting = pending || isPending;

  return (
    <button
      type="submit"
      className={`${panelPrimaryButtonClassName} w-full disabled:cursor-not-allowed disabled:opacity-70`}
      disabled={isSubmitting}
    >
      <Plus className="size-4" aria-hidden="true" />
      {isSubmitting ? "Ekleniyor..." : "Ödeme Ekle"}
    </button>
  );
}

function isPaymentFormValues(
  values: PaymentFormValues | Record<string, string> | undefined,
): values is PaymentFormValues {
  return Boolean(values && "payment_date" in values);
}

export function TransactionPaymentForm({
  transactionId,
  defaultReceivedBy,
  onSuccess,
}: Readonly<{
  transactionId: string;
  defaultReceivedBy: string;
  onSuccess?: () => void;
}>) {
  const [state, setState] = useState<TransactionActionState>(undefined);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const values = state?.error && isPaymentFormValues(state.values)
    ? state.values
    : undefined;
  const formRestoreKey = getFormRestoreKey(values);

  const handleSubmit = (formData: FormData) => {
    if (isPending) return;
    startTransition(async () => {
      const result = await runTimedMutation(
        { action: "addTransactionPayment", clientRefresh: false },
        () => addTransactionPayment(undefined, formData),
      );
      setState(result);

      if (result?.success) {
        // Server revalidatePath already refreshes the active detail route.
        onSuccess?.();
      }
    });
  };

  return (
    <form key={formRestoreKey} action={handleSubmit} className="space-y-2">
      <input type="hidden" name="transaction_id" value={transactionId} />
      <Field label="Ödeme tarihi">
        <input
          type="date"
          name="payment_date"
          defaultValue={values?.payment_date ?? today}
          className={inputClassName}
          required
        />
      </Field>
      <Field label="Ödeme yöntemi">
        <select
          name="payment_method"
          className={inputClassName}
          defaultValue={values?.payment_method ?? ""}
          required
        >
          <option value="" disabled>
            Ödeme yöntemi seçin
          </option>
          <option value="cash">Nakit</option>
          <option value="credit_card">Kredi Kartı</option>
          <option value="bank_transfer">Havale</option>
        </select>
      </Field>
      <Field label="Tutar">
        <input
          type="text"
          name="amount"
          inputMode="decimal"
          className={inputClassName}
          defaultValue={values?.amount ?? ""}
          placeholder="Örn. ₺5.000"
          required
        />
      </Field>
      <Field label="Açıklama">
        <input
          type="text"
          name="description"
          className={inputClassName}
          defaultValue={values?.description ?? ""}
          placeholder="Ödeme açıklaması"
        />
      </Field>
      <Field label="Alan personel">
        <input
          type="text"
          name="received_by"
          className={inputClassName}
          defaultValue={values?.received_by ?? defaultReceivedBy}
          placeholder="Örn. Admin Kullanıcı"
        />
      </Field>

      {state?.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}

      {state?.warning ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {state.warning}
        </p>
      ) : null}

      <SubmitButton isPending={isPending} />
      {isPending ? (
        <span className="sr-only" aria-live="polite">
          Ödeme kaydediliyor
        </span>
      ) : null}
    </form>
  );
}
