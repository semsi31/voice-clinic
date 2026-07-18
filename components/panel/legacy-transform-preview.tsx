"use client";

import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/transactions";
import {
  type LegacyTransformPlan,
  type LegacyTransformTarget,
} from "@/lib/legacy-transform";
import {
  panelPrimaryButtonClassName,
  panelTableScrollClassName,
} from "@/components/panel/panel-styles";

const PREVIEW_ROW_LIMIT = 300;

const TARGET_LABELS: Record<LegacyTransformTarget, string> = {
  cargo_records: "cargo_records",
  finance_expense: "finance_records expense",
  patient_transaction: "patient_transactions",
  review_required: "review_required",
  skip: "skip",
};

const TARGET_CLASSES: Record<LegacyTransformTarget, string> = {
  cargo_records: "border-violet-200 bg-violet-50 text-violet-800",
  finance_expense: "border-rose-200 bg-rose-50 text-rose-800",
  patient_transaction: "border-sky-200 bg-sky-50 text-sky-800",
  review_required: "border-amber-200 bg-amber-50 text-amber-800",
  skip: "border-slate-200 bg-slate-50 text-slate-700",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  bank_transfer: "Banka",
  credit_card: "Kredi Kartı",
};

function TargetBadge({ target }: Readonly<{ target: LegacyTransformTarget }>) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${TARGET_CLASSES[target]}`}
    >
      {TARGET_LABELS[target]}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: Readonly<{
  label: string;
  value: string | number;
  tone?: "default" | "green" | "red" | "blue" | "amber" | "violet";
}>) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "red"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : tone === "blue"
          ? "border-sky-200 bg-sky-50 text-sky-900"
          : tone === "amber"
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : tone === "violet"
              ? "border-violet-200 bg-violet-50 text-violet-900"
              : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-75">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function RiskBadges({ risks }: Readonly<{ risks: string[] }>) {
  if (risks.length === 0) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from(new Set(risks)).map((risk) => (
        <span
          key={risk}
          className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
        >
          {risk}
        </span>
      ))}
    </div>
  );
}

export function LegacyTransformPreview({
  plan,
}: Readonly<{ plan: LegacyTransformPlan }>) {
  const visibleRows = plan.rows.slice(0, PREVIEW_ROW_LIMIT);

  return (
    <section className="rounded-3xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 border-b border-indigo-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">
            Legacy Dönüşüm Önizlemesi
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Analiz edilen satırlar için veritabanına yazmadan dry-run dönüşüm
            planı üretildi. Eski Excel dosyalarından gerçek içe aktarım
            kapalıdır; temiz standart şablona aktarın.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
          <AlertTriangle className="size-4" aria-hidden="true" />
          Dry-run
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          label="cargo_records adayı"
          value={plan.summary.cargoRecordsCount}
          tone="violet"
        />
        <SummaryCard
          label="finance_records expense adayı"
          value={plan.summary.financeExpenseCount}
          tone="red"
        />
        <SummaryCard
          label="patient_transactions adayı"
          value={plan.summary.patientTransactionCount}
          tone="blue"
        />
        <SummaryCard
          label="review_required"
          value={plan.summary.reviewRequiredCount}
          tone="amber"
        />
        <SummaryCard label="skip" value={plan.summary.skipCount} />
        <SummaryCard
          label="tahmini satış toplamı"
          value={formatCurrency(plan.summary.estimatedSaleTotal)}
          tone="blue"
        />
        <SummaryCard
          label="önerilen ödeme toplamı"
          value={formatCurrency(plan.summary.suggestedPaymentTotal)}
          tone="green"
        />
        <SummaryCard
          label="tahmini gider toplamı"
          value={formatCurrency(plan.summary.estimatedExpenseTotal)}
          tone="red"
        />
        <SummaryCard
          label="kargo kayıt sayısı"
          value={plan.summary.cargoRecordCount}
          tone="violet"
        />
        <SummaryCard
          label="telefon eksik ama aktarılabilir"
          value={plan.summary.transferableMissingPhoneCount}
          tone="amber"
        />
        <SummaryCard
          label="tarih düzeltilmesi gereken"
          value={plan.summary.dateFixRequiredCount}
          tone="red"
        />
      </div>

      {plan.rows.length > PREVIEW_ROW_LIMIT ? (
        <p className="mt-4 text-sm text-slate-600">
          Performans için ilk {PREVIEW_ROW_LIMIT} dönüşüm satırı gösteriliyor
          (toplam {plan.rows.length} satır için plan üretildi).
        </p>
      ) : null}

      <div className={`${panelTableScrollClassName} mt-5 bg-white`}>
        <table className="w-full min-w-[1700px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="border-b border-slate-200 px-3 py-2.5">Satır No</th>
              <th className="border-b border-slate-200 px-3 py-2.5">Tarih</th>
              <th className="border-b border-slate-200 px-3 py-2.5">
                Kaynak Sheet
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5">
                Hasta / Gönderen
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5">
                İşlem / Prosedür
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5">
                Hedef Tablo
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                Önerilen Tutar
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                Önerilen Ödeme
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5">
                Ödeme Yöntemleri
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                Kalan Borç
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5">
                Marka / Model / Seri No
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5">Riskler</th>
              <th className="border-b border-slate-200 px-3 py-2.5">Not</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={`${row.sheetName}-${row.rowNumber}`}
                className="text-slate-700 odd:bg-white even:bg-[#EEF2F7]"
              >
                <td className="border-b border-slate-100 px-3 py-3 tabular-nums">
                  {row.rowNumber}
                </td>
                <td className="border-b border-slate-100 px-3 py-3 whitespace-nowrap">
                  {row.date ?? "-"}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  {row.sheetName}
                </td>
                <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-950">
                  {row.personName ?? "-"}
                </td>
                <td className="max-w-56 border-b border-slate-100 px-3 py-3">
                  <span className="line-clamp-2">{row.operation ?? "-"}</span>
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  <TargetBadge target={row.target} />
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                  {row.suggestedAmount == null
                    ? "-"
                    : formatCurrency(row.suggestedAmount)}
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                  {row.suggestedPaymentTotal > 0
                    ? formatCurrency(row.suggestedPaymentTotal)
                    : "-"}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  {row.paymentMethods.length > 0
                    ? row.paymentMethods
                        .map(
                          (payment) =>
                            `${PAYMENT_METHOD_LABELS[payment.method]} ${formatCurrency(payment.amount)}`,
                        )
                        .join(" / ")
                    : "-"}
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                  {row.remainingDebt == null
                    ? "-"
                    : formatCurrency(row.remainingDebt)}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  {[row.brand, row.model, row.serialNo, row.earSide]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </td>
                <td className="min-w-64 border-b border-slate-100 px-3 py-3">
                  <RiskBadges risks={row.risks} />
                </td>
                <td className="max-w-64 border-b border-slate-100 px-3 py-3 text-xs text-slate-600">
                  <span className="line-clamp-3">{row.note ?? "-"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Bu bölüm yalnızca analiz amaçlıdır. Eski Excel&apos;den doğrudan
          veritabanına aktarım kapalıdır. Aktarmak istediğiniz kayıtları temiz
          standart şablona taşıyın.
        </p>
        <button
          type="button"
          disabled
          title="Legacy gerçek import kapalıdır; temiz standart şablon kullanın."
          className={`${panelPrimaryButtonClassName} w-full cursor-not-allowed opacity-50 sm:w-auto`}
        >
          Legacy İçe Aktarım Kapalı
        </button>
      </div>
    </section>
  );
}
