"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import {
  createPatientTransaction,
  type NewTransactionFormValues,
} from "@/app/(panel)/panel/transactions/actions";
import { PanelCard } from "@/components/panel/panel-card";
import {
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
} from "@/components/panel/panel-styles";
import { TransactionDeviceFields } from "@/components/panel/transaction-device-fields";
import type { StockProductRecord } from "@/lib/stock";

const inputClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

function Field({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={`${panelPrimaryButtonClassName} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70`}
      disabled={pending}
    >
      <Save className="size-4" aria-hidden="true" />
      {pending ? "Kaydediliyor..." : "İşlemi Kaydet"}
    </button>
  );
}

function getFormRestoreKey(values?: NewTransactionFormValues) {
  return values ? JSON.stringify(values) : "initial";
}

export function NewTransactionForm({
  stockProducts,
}: Readonly<{
  stockProducts: StockProductRecord[];
}>) {
  const [state, formAction] = useActionState(createPatientTransaction, undefined);
  const values = state?.values;
  const today = new Date().toISOString().slice(0, 10);
  const formRestoreKey = getFormRestoreKey(values);

  return (
    <form key={formRestoreKey} action={formAction} className="space-y-5">
      <PanelCard
        title="Hasta Bilgileri"
        description="İşlem yapılacak hastayı seçin veya yeni hasta bilgisini girin."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Hasta seçimi veya yeni hasta adı soyadı">
            <input
              type="text"
              name="patient_name"
              className={inputClassName}
              placeholder="Örn. Ayşe Kaya"
              defaultValue={values?.patient_name ?? ""}
              required
            />
          </Field>
          <Field label="Telefon">
            <input
              type="tel"
              name="patient_phone"
              className={inputClassName}
              placeholder="Örn. 0532 000 00 00"
              defaultValue={values?.patient_phone ?? ""}
            />
          </Field>
          <div className="lg:col-span-2">
            <Field label="Açıklama">
              <textarea
                name="description"
                className={textareaClassName}
                placeholder="Hasta veya işlem hakkında kısa not ekleyin."
                defaultValue={values?.description ?? ""}
              />
            </Field>
          </div>
          <Field label="Hatırlatma Tarihi">
            <input
              type="date"
              name="reminder_date"
              className={inputClassName}
              defaultValue={values?.reminder_date ?? ""}
            />
            <span className="text-xs font-medium text-slate-500">
              Boş bırakılırsa hatırlatıcı oluşturulmaz.
            </span>
          </Field>
          <div className="lg:col-span-2">
            <Field label="Hatırlatma Açıklaması">
              <textarea
                name="reminder_description"
                className={textareaClassName}
                placeholder="Hatırlatıcı notu (opsiyonel)"
                defaultValue={values?.reminder_description ?? ""}
              />
              <span className="text-xs font-medium text-slate-500">
                Hatırlatma tarihi girildiğinde bu açıklama hatırlatıcıya yazılır.
              </span>
            </Field>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="İşlem Bilgileri"
        description="Tarih, birim, referans ve işlem detaylarını girin."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Şube / Birim">
            <input
              type="text"
              name="branch"
              className={inputClassName}
              placeholder="Örn. Merkez, Klinik, Satış birimi"
              defaultValue={values?.branch ?? ""}
            />
          </Field>
          <Field label="Tarih">
            <input
              type="date"
              name="transaction_date"
              defaultValue={values?.transaction_date || today}
              className={inputClassName}
              required
            />
          </Field>
          <Field label="Hastane">
            <input
              type="text"
              name="hospital"
              className={inputClassName}
              placeholder="Örn. Voice Klinik"
              defaultValue={values?.hospital ?? ""}
            />
          </Field>
          <Field label="Raporu çıkaran hekim">
            <input
              type="text"
              name="doctor_name"
              className={inputClassName}
              placeholder="Örn. Dr. Mehmet Yılmaz"
              defaultValue={values?.doctor_name ?? ""}
            />
          </Field>
          <Field label="Referans">
            <input
              type="text"
              name="reference_source"
              className={inputClassName}
              placeholder="Örn. Doktor yönlendirmesi"
              defaultValue={values?.reference_source ?? ""}
            />
          </Field>
          <Field label="Yapılan işlem">
            <input
              type="text"
              name="operation_description"
              className={inputClassName}
              placeholder="Örn. Cihaz satışı, tamir, kontrol, yedek parça, pil satışı"
              defaultValue={values?.operation_description ?? ""}
              required
            />
          </Field>
          <Field label="İlgilenen personel">
            <input
              type="text"
              name="staff_name"
              className={inputClassName}
              placeholder="Örn. Admin Kullanıcı"
              defaultValue={values?.staff_name ?? ""}
            />
          </Field>
        </div>
      </PanelCard>

      <PanelCard
        title="Cihaz / Ürün Bilgileri"
        description="Satış veya servis işlemine ait cihaz veya ürün detaylarını girin."
      >
        <TransactionDeviceFields stockProducts={stockProducts} values={values} />
      </PanelCard>

      <PanelCard
        title="Satış ve Ödeme Bilgileri"
        description="Satış tutarını girin; ilk ödeme alanları isteğe bağlıdır."
      >
        <div className="grid gap-5">
          <Field label="Satış tutarı">
            <input
              type="text"
              name="sale_amount"
              inputMode="decimal"
              className={inputClassName}
              placeholder="Örn. ₺42.500"
              defaultValue={values?.sale_amount ?? ""}
              required
            />
            <span className="text-xs font-medium text-slate-500">
              Zorunlu alan — işlemin toplam satış tutarı
            </span>
          </Field>

          <div className="grid gap-5 lg:grid-cols-3">
            <Field label="İlk ödeme tarihi (opsiyonel)">
              <input
                type="date"
                name="first_payment_date"
                defaultValue={values?.first_payment_date || today}
                className={inputClassName}
              />
            </Field>
            <Field label="İlk ödeme yöntemi (opsiyonel)">
              <select
                name="first_payment_method"
                className={inputClassName}
                defaultValue={values?.first_payment_method ?? ""}
              >
                <option value="">Seçilmedi</option>
                <option value="cash">Nakit</option>
                <option value="credit_card">Kredi Kartı</option>
                <option value="bank_transfer">Havale</option>
              </select>
            </Field>
            <Field label="İlk ödeme tutarı (opsiyonel)">
              <input
                type="text"
                name="first_payment_amount"
                inputMode="decimal"
                className={inputClassName}
                placeholder="Örn. ₺10.000"
                defaultValue={values?.first_payment_amount ?? ""}
              />
            </Field>
          </div>

          <Field label="İlk ödeme açıklaması (opsiyonel)">
            <input
              type="text"
              name="first_payment_description"
              className={inputClassName}
              placeholder="Örn. Peşinat"
              defaultValue={values?.first_payment_description ?? ""}
            />
          </Field>

          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm font-bold text-sky-900">Kalan borç</p>
            <p className="mt-1.5 text-sm leading-6 text-sky-800">
              İlk ödeme girilirse kalan borç satış tutarından düşülerek
              veritabanı trigger sistemi ile hesaplanır. Sonraki ödemeler işlem detay
              sayfasından eklenir.
            </p>
          </div>
        </div>
      </PanelCard>

      {state?.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/panel/transactions"
          className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
        >
          İptal
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
