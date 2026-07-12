"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { FileSearch, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import {
  analyzeLegacySheet,
  LEGACY_CATEGORY_LABELS,
  type LegacyImportAnalysis,
  type LegacyImportRowAnalysis,
  type LegacyRowCategory,
} from "@/lib/legacy-import";
import { buildLegacyTransformPlan } from "@/lib/legacy-transform";
import { formatCurrency } from "@/lib/transactions";
import { LegacyTransformPreview } from "@/components/panel/legacy-transform-preview";
import {
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
  panelTableScrollClassName,
} from "@/components/panel/panel-styles";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PREVIEW_ROW_LIMIT = 300;

const CATEGORY_BADGE_CLASSES: Record<LegacyRowCategory, string> = {
  patient_transaction: "border-sky-200 bg-sky-50 text-sky-800",
  collection: "border-emerald-200 bg-emerald-50 text-emerald-800",
  expense: "border-rose-200 bg-rose-50 text-rose-800",
  cargo: "border-violet-200 bg-violet-50 text-violet-800",
  stock: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
  review: "border-rose-300 bg-rose-100 text-rose-900",
};

const CATEGORY_ROW_CLASSES: Partial<Record<LegacyRowCategory, string>> = {
  review: "bg-rose-50/60",
  expense: "bg-rose-50/30",
};

function CategoryBadge({ category }: Readonly<{ category: LegacyRowCategory }>) {
  return (
    <span
      className={`inline-flex whitespace-nowrap items-center rounded-full border px-2.5 py-1 text-xs font-bold ${CATEGORY_BADGE_CLASSES[category]}`}
    >
      {LEGACY_CATEGORY_LABELS[category]}
    </span>
  );
}

function WarningBadges({ row }: Readonly<{ row: LegacyImportRowAnalysis }>) {
  const items = [
    ...row.errors.map((text) => ({ text, isError: true })),
    ...row.warnings.map((text) => ({ text, isError: false })),
  ];

  if (items.length === 0) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span
          key={item.text}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            item.isError
              ? "border-rose-300 bg-rose-100 text-rose-900"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}

function money(value: number | null) {
  return value == null ? "-" : formatCurrency(value);
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

export function LegacyImportAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LegacyImportAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, startReadTransition] = useTransition();
  const [isAnalyzing, startAnalyzeTransition] = useTransition();

  const handleFile = (file: File | null) => {
    if (!file) {
      return;
    }

    setError(null);
    setAnalysis(null);
    setWorkbook(null);
    setSelectedSheet(null);

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
      setError("Yalnızca .xlsx veya .xls dosyaları desteklenir.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Dosya boyutu 10 MB sınırını aşıyor.");
      return;
    }

    setFileName(file.name);

    startReadTransition(async () => {
      try {
        const buffer = await file.arrayBuffer();
        const parsed = XLSX.read(buffer, { type: "array", cellDates: true });

        if (parsed.SheetNames.length === 0) {
          setError("Dosyada sheet bulunamadı.");
          return;
        }

        setWorkbook(parsed);
        setSelectedSheet(parsed.SheetNames[0]);
      } catch {
        setError("Excel dosyası okunamadı.");
      }
    });
  };

  const handleAnalyze = () => {
    if (!workbook || !selectedSheet) {
      return;
    }

    setError(null);

    startAnalyzeTransition(async () => {
      try {
        const result = analyzeLegacySheet(workbook, selectedSheet);
        setAnalysis(result);
      } catch {
        setAnalysis(null);
        setError("Sheet analiz edilirken bir hata oluştu.");
      }
    });
  };

  const visibleRows = useMemo(
    () => (analysis ? analysis.rows.slice(0, PREVIEW_ROW_LIMIT) : []),
    [analysis],
  );
  const mappedHeaders = analysis?.mappedHeaders ?? [];
  const unmappedHeaders = analysis?.unmappedHeaders ?? [];
  const topProcedures = analysis?.topProcedures ?? [];
  const transformPlan = useMemo(
    () => (analysis ? buildLegacyTransformPlan(analysis) : null),
    [analysis],
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
          Eski Excel Analizi
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Standart şablona uymayan eski faaliyet dosyalarını önce analiz edin.
          Bu bölüm yalnızca inceleme ve dönüşüm fikri üretmek içindir;
          veritabanına kayıt yapılmaz.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
          Eski faaliyet dosyaları düzensiz kolon, bozuk tarih ve karışık
          tahsilat içerdiği için doğrudan içe aktarılmaz. Bu ekran yalnızca
          hangi satırların hasta işlemi, gider, kargo veya inceleme gerektiren
          satır olduğunu anlamak içindir. Gerçek aktarım için temiz standart
          şablonu kullanın. Stok kayıtları Excel&apos;den aktarılmaz; stok panelden
          manuel yönetilir.
        </p>
      </div>

      <div
        className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center sm:px-8"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
          <Upload className="size-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-slate-950">
          Eski Excel dosyanızı buraya sürükleyin
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          veya bilgisayarınızdan dosya seçin
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isReading}
          className={`${panelSecondaryButtonClassName} mt-5 disabled:cursor-not-allowed disabled:opacity-70`}
        >
          {isReading ? "Dosya okunuyor..." : "Dosya Seç"}
        </button>
        {fileName ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileSpreadsheet className="size-4 text-slate-500" aria-hidden="true" />
            {fileName}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </p>
      ) : null}

      {workbook ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Sheet Seçin ({workbook.SheetNames.length} sheet bulundu)
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {workbook.SheetNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setSelectedSheet(name);
                  setAnalysis(null);
                }}
                className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                  selectedSheet === name
                    ? "border-violet-300 bg-violet-100 text-violet-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!selectedSheet || isAnalyzing}
            className={`${panelPrimaryButtonClassName} mt-4 disabled:cursor-not-allowed disabled:opacity-70`}
          >
            <FileSearch className="size-4" aria-hidden="true" />
            {isAnalyzing ? "Analiz ediliyor..." : "Analiz Et"}
          </button>
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Analiz Özeti — {analysis.sheetName}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <SummaryCard
                label="Toplam satır"
                value={analysis.summary.totalRowsScanned}
              />
              <SummaryCard
                label="Okunan anlamlı satır"
                value={analysis.summary.meaningfulRows}
              />
              <SummaryCard
                label="Hasta işlem adayı"
                value={analysis.summary.patientTransactionCount}
                tone="blue"
              />
              <SummaryCard
                label="Tahsilat adayı"
                value={analysis.summary.collectionCount}
                tone="green"
              />
              <SummaryCard
                label="Gider adayı"
                value={analysis.summary.expenseCount}
                tone="red"
              />
              <SummaryCard
                label="Kargo adayı"
                value={analysis.summary.cargoCount}
                tone="violet"
              />
              <SummaryCard
                label="Stok hareketi adayı"
                value={analysis.summary.stockCount}
                tone="amber"
              />
              <SummaryCard
                label="Bilgi / not satırı"
                value={analysis.summary.infoCount}
              />
              <SummaryCard
                label="Hatalı / incelenmeli"
                value={analysis.summary.reviewCount}
                tone="red"
              />
              <SummaryCard
                label="Telefon bulunamayan"
                value={analysis.summary.phoneMissingCount}
                tone="amber"
              />
              <SummaryCard
                label="Tarih hatalı satır"
                value={analysis.summary.invalidDateCount}
                tone="red"
              />
              <SummaryCard
                label="Toplam satış tutarı adayı"
                value={formatCurrency(analysis.summary.saleAmountTotal)}
                tone="blue"
              />
              <SummaryCard
                label="Toplam gelir adayı"
                value={formatCurrency(analysis.summary.incomeTotal)}
                tone="green"
              />
              <SummaryCard
                label="Toplam gider adayı"
                value={formatCurrency(analysis.summary.expenseTotal)}
                tone="red"
              />
              <SummaryCard
                label="Toplam banka/kart adayı"
                value={formatCurrency(analysis.summary.bankCardTotal)}
                tone="blue"
              />
              <SummaryCard
                label="Toplam kalan borç adayı"
                value={formatCurrency(analysis.summary.remainingDebtTotal)}
                tone="amber"
              />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                Eşlenen kolonlar
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mappedHeaders.length > 0 ? (
                  mappedHeaders.map((column) => (
                    <span
                      key={`${column.columnIndex}-${column.header}`}
                      className="inline-flex rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-900"
                    >
                      {column.header}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-emerald-900">
                    Eşlenen kolon bulunamadı.
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                Eşlenemeyen kolonlar
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {unmappedHeaders.length > 0 ? (
                  unmappedHeaders.map((header) => (
                    <span
                      key={header}
                      className="inline-flex rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-900"
                    >
                      {header}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-amber-900">
                    Tüm başlıklar eşlendi.
                  </span>
                )}
              </div>
            </div>
          </div>

          {topProcedures.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                En sık görülen işlem / prosedür değerleri
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {topProcedures.map((item) => (
                  <span
                    key={item.value}
                    className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700"
                  >
                    {item.value} ({item.count})
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {transformPlan ? <LegacyTransformPreview plan={transformPlan} /> : null}

          {analysis.rows.length > PREVIEW_ROW_LIMIT ? (
            <p className="text-sm text-slate-600">
              Performans için ilk {PREVIEW_ROW_LIMIT} satır gösteriliyor
              (toplam {analysis.rows.length} anlamlı satır analiz edildi;
              özet tüm satırları kapsar).
            </p>
          ) : null}

          <div className={panelTableScrollClassName}>
            <table className="w-full min-w-[2100px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2.5">Satır No</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Tarih</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    Hasta / Gönderen
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    İşlem / Prosedür
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Kategori</th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Satış Tutarı
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Gelir
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Gider
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Banka
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Kredi Kartı
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Kalan Borç
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Marka</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Model</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Seri No</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Kulak</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    İlgilenen Personel
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    Firma / Kargo Firması
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Telefon</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">
                    Riskler / Uyarılar
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5">Ham Not</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`text-slate-700 ${CATEGORY_ROW_CLASSES[row.category] ?? ""}`}
                  >
                    <td className="border-b border-slate-100 px-3 py-3 tabular-nums">
                      {row.rowNumber}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 whitespace-nowrap">
                      {row.normalized.dateStatus === "invalid" ? (
                        <span className="font-semibold text-rose-700">
                          {row.normalized.dateRaw || "-"}
                        </span>
                      ) : (
                        (row.normalized.dateISO ?? "-")
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-950">
                      {row.normalized.patientName ??
                        row.normalized.sender ??
                        "-"}
                    </td>
                    <td className="max-w-56 border-b border-slate-100 px-3 py-3">
                      <span className="line-clamp-2">
                        {row.normalized.procedure ?? "-"}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <CategoryBadge category={row.category} />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {money(row.normalized.saleAmount)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {money(row.normalized.income)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {money(row.normalized.expense)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {money(row.normalized.bank)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {money(row.normalized.creditCard)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right font-semibold tabular-nums text-slate-950">
                      {money(row.normalized.remainingDebt)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {row.normalized.brand ?? "-"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {row.normalized.model ?? "-"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {row.normalized.serialNo ?? "-"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {row.normalized.earSide ?? "-"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {row.normalized.staff ?? "-"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {row.normalized.cargoCompany ??
                        row.normalized.cargoBranch ??
                        "-"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 whitespace-nowrap">
                      {row.normalized.phone ? (
                        <span>
                          {row.normalized.phone}
                          {row.normalized.phoneSource === "note" ? (
                            <span className="ml-1 text-[11px] font-semibold text-slate-500">
                              (nottan)
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="min-w-52 border-b border-slate-100 px-3 py-3">
                      <WarningBadges row={row} />
                    </td>
                    <td className="max-w-64 border-b border-slate-100 px-3 py-3 text-xs text-slate-600">
                      <span className="line-clamp-3">
                        {row.normalized.note ?? "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Bu mod yalnızca analiz içindir; hiçbir veri veritabanına yazılmaz.
              Gerçek aktarım için temiz standart şablon kullanılmalıdır.
            </p>
            <button
              type="button"
              disabled
              title="Analiz tamamlandıktan sonra dönüşüm kuralları belirlenecek"
              className={`${panelPrimaryButtonClassName} w-full cursor-not-allowed opacity-50 sm:w-auto`}
            >
              İçe Aktar (devre dışı)
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
